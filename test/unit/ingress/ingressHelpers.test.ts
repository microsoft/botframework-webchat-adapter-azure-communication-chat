import { LogLevel } from '../../../src/log/Logger';
import { Logger } from '../../../src/log/Logger';
import { ACSAdapterState, StateKey } from '../../../src/models/ACSAdapterState';
import { ChatEqualityFields, GetStateFunction } from '../../../src/types/AdapterTypes';
import { IFileManager } from '../../../src/types/FileManagerTypes';
import * as MessageComparison from '../../../src/utils/MessageComparison';
import { LoggerUtils } from '../../../src/utils/LoggerUtils';
import { ChatMessage, ParticipantsAddedEvent, ParticipantsRemovedEvent } from '@azure/communication-chat';

import {
  cacheTextMessageIfNeeded,
  isDuplicateMessage,
  updateMessageCacheWithMessage,
  cacheParticipantAddedEventIfNeeded,
  cacheParticipantRemovedEventIfNeeded,
  ProcessChatMessageEventProps,
  getIdFromIdentifier
} from '../../../src/ingress/ingressHelpers';
import { LogEvent } from '../../../src/types/LogTypes';
import {
  CommunicationIdentifierKind,
  MicrosoftTeamsUserKind,
  PhoneNumberKind,
  UnknownIdentifierKind
} from '@azure/communication-common';

// Mock dependencies
jest.mock('../../../src/log/Logger');
jest.mock('../../../src/utils/MessageComparison');

describe('ingressHelpers', () => {
  // Common test variables
  let messageCache: Map<string, ChatEqualityFields>;
  let getState: GetStateFunction<ACSAdapterState>;
  let fileManager: IFileManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock all LoggerUtils static methods
    jest.spyOn(LoggerUtils, 'logUnsupportedMessageType').mockImplementation(jest.fn());
    jest.spyOn(LoggerUtils, 'logProcessingParticipantAddedEvent').mockImplementation(jest.fn());
    jest.spyOn(LoggerUtils, 'logProcessingParticipantRemovedEvent').mockImplementation(jest.fn());

    // Setup common test variables
    messageCache = new Map();
    getState = jest.fn().mockImplementation((key: StateKey) => {
      if (key === StateKey.ThreadId) return 'thread-123';
      return undefined;
    });
    fileManager = {
      getFileIds: jest.fn().mockReturnValue(['file-1']),
      uploadFiles: jest.fn(),
      downloadFiles: jest.fn(),
      updatePermissions: jest.fn(),
      createFileIdProperty: jest.fn(),
      getFileMetadata: jest.fn(),
      createFileMetadataProperty: jest.fn(),
      createBotAttachment: jest.fn()
    };
  });

  describe('cacheTextMessageIfNeeded', () => {
    test('should return true and not update cache if message is already processed', () => {
      const event: ProcessChatMessageEventProps = {
        id: 'msg-123',
        message: 'Hello world',
        createdOn: new Date(),
        editedOn: undefined,
        deletedOn: undefined,
        metadata: {},
        sender: { kind: 'communicationUser', communicationUserId: 'user-123' },
        threadId: 'thread-123'
      };

      (MessageComparison.checkDuplicateMessage as jest.Mock).mockReturnValue(true);

      const result = cacheTextMessageIfNeeded(messageCache, event, getState, fileManager, LogEvent.MESSAGE_RECEIVED);

      expect(result).toBe(true);
      expect(messageCache.size).toBe(0);
      expect(Logger.logEvent).not.toHaveBeenCalled();
    });

    test('should return false, update cache, and log if message has not been processed', () => {
      const createdOn = new Date('2025-05-10T10:00:00Z');
      const updatedOn = new Date('2025-05-11T10:00:00Z');
      const deletedOn = new Date('2025-05-12T10:00:00Z');

      const event: ProcessChatMessageEventProps = {
        id: 'msg-123',
        message: 'Hello world',
        createdOn: createdOn,
        editedOn: updatedOn,
        deletedOn: deletedOn,
        metadata: {},
        sender: { kind: 'communicationUser', communicationUserId: 'user-123' },
        threadId: 'thread-123'
      };

      (MessageComparison.checkDuplicateMessage as jest.Mock).mockReturnValue(false);

      const result = cacheTextMessageIfNeeded(messageCache, event, getState, fileManager, LogEvent.MESSAGE_RECEIVED);

      expect(result).toBe(false);
      expect(messageCache.size).toBe(1);
      expect(messageCache.get('msg-123')).toEqual({
        content: 'Hello world',
        updatedOn: updatedOn,
        deletedOn: deletedOn,
        fileIds: ['file-1']
      });
      expect(Logger.logEvent).toHaveBeenCalledWith(LogLevel.INFO, expect.any(Object));
    });
  });

  describe('isDuplicateMessage', () => {
    test('should check for duplicate text message', () => {
      const createdOn = new Date('2025-05-10T10:00:00Z');
      const updatedOn = new Date('2025-05-11T10:00:00Z');
      const deletedOn = new Date('2025-05-12T10:00:00Z');
      const message = {
        id: 'msg-123',
        type: 'text',
        content: { message: 'Hello world' },
        editedOn: updatedOn,
        deletedOn: deletedOn,
        createdOn: createdOn,
        metadata: {}
      } as ChatMessage;

      (MessageComparison.checkDuplicateMessage as jest.Mock).mockReturnValue(true);

      const result = isDuplicateMessage(message, messageCache, fileManager);

      expect(result).toBe(true);
      expect(MessageComparison.checkDuplicateMessage).toHaveBeenCalledWith(
        messageCache,
        'msg-123',
        expect.objectContaining({
          content: 'Hello world',
          updatedOn: updatedOn,
          deletedOn: deletedOn
        })
      );
    });

    test('should check for duplicate participantAdded message', () => {
      const message: ChatMessage = {
        id: 'msg-123',
        type: 'participantAdded',
        content: {
          participants: [{ id: { communicationUserId: 'user-123' } }],
          initiator: { communicationUserId: 'user-456', kind: 'communicationUser' }
        },
        sequenceId: '1',
        version: '1',
        createdOn: new Date()
      };

      (MessageComparison.createParticipantMessageKeyWithMessage as jest.Mock).mockReturnValue(
        'participantAdded-msg-123'
      );
      (MessageComparison.checkDuplicateParticipantMessage as jest.Mock).mockReturnValue(true);

      const result = isDuplicateMessage(message, messageCache, fileManager);

      expect(result).toBe(true);
      expect(MessageComparison.checkDuplicateParticipantMessage).toHaveBeenCalledWith(
        messageCache,
        'participantAdded-msg-123',
        expect.objectContaining({
          addedParticipants: [{ id: { communicationUserId: 'user-123' } }]
        })
      );
    });

    test('should check for duplicate participantRemoved message', () => {
      const message: ChatMessage = {
        id: 'msg-123',
        type: 'participantRemoved',
        content: {
          participants: [{ id: { communicationUserId: 'user-123' } }],
          initiator: { communicationUserId: 'user-456', kind: 'communicationUser' }
        },
        sequenceId: '1',
        version: '1',
        createdOn: new Date()
      };

      (MessageComparison.createParticipantMessageKeyWithMessage as jest.Mock).mockReturnValue(
        'participantRemoved-msg-123'
      );
      (MessageComparison.checkDuplicateParticipantMessage as jest.Mock).mockReturnValue(true);

      const result = isDuplicateMessage(message, messageCache, fileManager);

      expect(result).toBe(true);
      expect(MessageComparison.checkDuplicateParticipantMessage).toHaveBeenCalledWith(
        messageCache,
        'participantRemoved-msg-123',
        expect.objectContaining({
          removedParticipants: [{ id: { communicationUserId: 'user-123' } }]
        })
      );
    });

    test('should log and return false for unsupported message type', () => {
      const message: ChatMessage = {
        id: 'msg-123',
        type: 'topicUpdated',
        sequenceId: '1',
        version: '1',
        createdOn: new Date()
      } as ChatMessage;

      const result = isDuplicateMessage(message, messageCache, fileManager);

      expect(result).toBe(false);
      expect(LoggerUtils.logUnsupportedMessageType).toHaveBeenCalledWith(message);
    });
  });

  describe('updateMessageCacheWithMessage', () => {
    test('should update cache for text message', () => {
      const updatedOn = new Date('2025-05-11T10:00:00Z');
      const deletedOn = new Date('2025-05-12T10:00:00Z');
      const message = {
        id: 'msg-123',
        type: 'text',
        content: { message: 'Hello world' },
        editedOn: updatedOn,
        deletedOn: deletedOn,
        metadata: {}
      } as ChatMessage;

      updateMessageCacheWithMessage(message, messageCache, fileManager);

      expect(messageCache.size).toBe(1);
      expect(messageCache.get('msg-123')).toEqual({
        content: 'Hello world',
        updatedOn: updatedOn,
        deletedOn: deletedOn,
        fileIds: ['file-1']
      });
    });

    test('should update cache for participantAdded message', () => {
      const message: ChatMessage = {
        id: 'msg-123',
        type: 'participantAdded',
        content: {
          participants: [{ id: { communicationUserId: 'user-123' } }],
          initiator: { communicationUserId: 'user-456', kind: 'communicationUser' }
        },
        sequenceId: '1',
        version: '1',
        createdOn: new Date()
      };

      (MessageComparison.createParticipantMessageKeyWithMessage as jest.Mock).mockReturnValue(
        'participantAdded-msg-123'
      );

      updateMessageCacheWithMessage(message, messageCache, fileManager);

      expect(messageCache.size).toBe(1);
      expect(messageCache.get('participantAdded-msg-123')).toEqual({
        addedParticipants: [{ id: { communicationUserId: 'user-123' } }]
      });
    });

    test('should update cache for participantRemoved message', () => {
      const message: ChatMessage = {
        id: 'msg-123',
        type: 'participantRemoved',
        content: {
          participants: [{ id: { communicationUserId: 'user-123' } }],
          initiator: { communicationUserId: 'user-456', kind: 'communicationUser' }
        },
        sequenceId: '1',
        version: '1',
        createdOn: new Date()
      };

      (MessageComparison.createParticipantMessageKeyWithMessage as jest.Mock).mockReturnValue(
        'participantRemoved-msg-123'
      );

      updateMessageCacheWithMessage(message, messageCache, fileManager);

      expect(messageCache.size).toBe(1);
      expect(messageCache.get('participantRemoved-msg-123')).toEqual({
        removedParticipants: [{ id: { communicationUserId: 'user-123' } }]
      });
    });

    test('should log but not update cache for unsupported message type', () => {
      const message: ChatMessage = {
        id: 'msg-123',
        type: 'topicUpdated',
        sequenceId: '1',
        version: '1',
        createdOn: new Date()
      } as ChatMessage;

      updateMessageCacheWithMessage(message, messageCache, fileManager);

      expect(messageCache.size).toBe(0);
      expect(LoggerUtils.logUnsupportedMessageType).toHaveBeenCalledWith(message);
    });
  });

  describe('cacheParticipantAddedEventIfNeeded', () => {
    test('should return true and not update cache if event is already processed', () => {
      const event: ParticipantsAddedEvent = {
        participantsAdded: [
          { id: { communicationUserId: 'user-123', kind: 'communicationUser' }, displayName: 'User', metadata: {} }
        ],
        threadId: 'thread-123',
        addedBy: {
          id: { communicationUserId: 'user-admin', kind: 'communicationUser' },
          displayName: 'Admin',
          metadata: {}
        },
        addedOn: new Date(),
        version: '1'
      };

      (MessageComparison.createParticipantMessageKeyWithParticipantsEvent as jest.Mock).mockReturnValue(
        'participantAdded-event-123'
      );
      (MessageComparison.checkDuplicateParticipantMessage as jest.Mock).mockReturnValue(true);

      const result = cacheParticipantAddedEventIfNeeded(messageCache, event, getState);

      expect(result).toBe(true);
      expect(messageCache.size).toBe(0);
      expect(LoggerUtils.logProcessingParticipantAddedEvent).not.toHaveBeenCalled();
    });

    test('should return false, update cache, and log if event has not been processed', () => {
      const event: ParticipantsAddedEvent = {
        participantsAdded: [
          { id: { communicationUserId: 'user-123', kind: 'communicationUser' }, displayName: 'User', metadata: {} }
        ],
        threadId: 'thread-123',
        addedBy: {
          id: { communicationUserId: 'user-admin', kind: 'communicationUser' },
          displayName: 'Admin',
          metadata: {}
        },
        addedOn: new Date(),
        version: '1'
      };

      (MessageComparison.createParticipantMessageKeyWithParticipantsEvent as jest.Mock).mockReturnValue(
        'participantAdded-event-123'
      );
      (MessageComparison.checkDuplicateParticipantMessage as jest.Mock).mockReturnValue(false);

      const result = cacheParticipantAddedEventIfNeeded(messageCache, event, getState);

      expect(result).toBe(false);
      expect(messageCache.size).toBe(1);
      expect(messageCache.get('participantAdded-event-123')).toEqual({
        addedParticipants: [
          { id: { communicationUserId: 'user-123', kind: 'communicationUser' }, displayName: 'User', metadata: {} }
        ]
      });
      expect(LoggerUtils.logProcessingParticipantAddedEvent).toHaveBeenCalledWith(getState, event);
    });
  });

  describe('cacheParticipantRemovedEventIfNeeded', () => {
    test('should return true and not update cache if event is already processed', () => {
      const event: ParticipantsRemovedEvent = {
        participantsRemoved: [
          { id: { communicationUserId: 'user-123', kind: 'communicationUser' }, displayName: 'User', metadata: {} }
        ],
        threadId: 'thread-123',
        removedBy: {
          id: { communicationUserId: 'user-admin', kind: 'communicationUser' },
          displayName: 'Admin',
          metadata: {}
        },
        removedOn: new Date(),
        version: '1'
      };

      (MessageComparison.createParticipantMessageKeyWithParticipantsEvent as jest.Mock).mockReturnValue(
        'participantRemoved-event-123'
      );
      (MessageComparison.checkDuplicateParticipantMessage as jest.Mock).mockReturnValue(true);

      const result = cacheParticipantRemovedEventIfNeeded(messageCache, event, getState);

      expect(result).toBe(true);
      expect(messageCache.size).toBe(0);
      expect(LoggerUtils.logProcessingParticipantRemovedEvent).not.toHaveBeenCalled();
    });

    test('should return false, update cache, and log if event has not been processed', () => {
      const event: ParticipantsRemovedEvent = {
        participantsRemoved: [
          { id: { communicationUserId: 'user-123', kind: 'communicationUser' }, displayName: 'User', metadata: {} }
        ],
        threadId: 'thread-123',
        removedBy: {
          id: { communicationUserId: 'user-admin', kind: 'communicationUser' },
          displayName: 'Admin',
          metadata: {}
        },
        removedOn: new Date(),
        version: '1'
      };

      (MessageComparison.createParticipantMessageKeyWithParticipantsEvent as jest.Mock).mockReturnValue(
        'participantRemoved-event-123'
      );
      (MessageComparison.checkDuplicateParticipantMessage as jest.Mock).mockReturnValue(false);

      const result = cacheParticipantRemovedEventIfNeeded(messageCache, event, getState);

      expect(result).toBe(false);
      expect(messageCache.size).toBe(1);
      expect(messageCache.get('participantRemoved-event-123')).toEqual({
        removedParticipants: [
          { id: { communicationUserId: 'user-123', kind: 'communicationUser' }, displayName: 'User', metadata: {} }
        ]
      });
      expect(LoggerUtils.logProcessingParticipantRemovedEvent).toHaveBeenCalledWith(getState, event);
    });
  });

  describe('getIdFromIdentifier', () => {
    test('should return communicationUserId for communicationUser identifier', () => {
      const identifier: CommunicationIdentifierKind = {
        kind: 'communicationUser',
        communicationUserId: 'user-123'
      };
      const result = getIdFromIdentifier(identifier);
      expect(result).toBe('user-123');
    });

    test('should return microsoftTeamsUserId for microsoftTeamsUser identifier', () => {
      const identifier: MicrosoftTeamsUserKind = {
        kind: 'microsoftTeamsUser',
        microsoftTeamsUserId: 'teams-user-123'
      };
      const result = getIdFromIdentifier(identifier);
      expect(result).toBe('teams-user-123');
    });

    test('should return phoneNumber for phoneNumber identifier', () => {
      const identifier: PhoneNumberKind = {
        kind: 'phoneNumber',
        phoneNumber: '+1234567890'
      };
      const result = getIdFromIdentifier(identifier);
      expect(result).toBe('+1234567890');
    });

    test('should return id for unknown identifier', () => {
      const identifier: UnknownIdentifierKind = {
        kind: 'unknown',
        id: 'unknown-123'
      };
      const result = getIdFromIdentifier(identifier);
      expect(result).toBe('unknown-123');
    });
  });
});
