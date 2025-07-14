import { ChatMessage } from '@azure/communication-chat';
import { ACSDirectLineActivity } from '../../../../src/models/ACSDirectLineActivity';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import { ConnectionStatus } from '../../../../src/libs/enhancers/exportDLJSInterface';
import createHistoryMessageToDirectLineActivityMapper from '../../../../src/ingress/mappers/createHistoryMessageToDirectLineActivityMapper';
import {
  convertThreadUpdate,
  processParticipants
} from '../../../../src/ingress/eventconverters/ParticipantsConverter';
import { isChatMessageTypeSupported } from '../../../../src/utils/MessageUtils';
import {
  processHistoryMessage,
  convertAndProcessHistoryMessageByType
} from '../../../../src/ingress/eventconverters/HistoryMessageConverter';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { ActivityType, Role } from '../../../../src/types/DirectLineTypes';
import { Constants } from '../../../../src/Constants';

// Mock dependencies
jest.mock('../../../../src/ingress/mappers/createHistoryMessageToDirectLineActivityMapper');
jest.mock('../../../../src/ingress/eventconverters/ParticipantsConverter');
jest.mock('../../../../src/utils/MessageUtils');

describe('HistoryMessageConverter', () => {
  // Common test variables
  let getState: jest.Mock;
  let next: jest.Mock;
  let pagedHistoryMessagesBeforeWebChatInit: ChatMessage[];
  let mockTextMessage: ChatMessage;
  let mockParticipantAddedMessage: ChatMessage;
  let mockParticipantRemovedMessage: ChatMessage;
  let mockActivity: ACSDirectLineActivity;

  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();

    // Setup mocks
    getState = jest.fn().mockImplementation((key: StateKey) => {
      if (key === StateKey.WebChatStatus) {
        return ConnectionStatus.Connected;
      }
      return undefined;
    });

    next = jest.fn();
    pagedHistoryMessagesBeforeWebChatInit = [];

    mockTextMessage = {
      id: 'message-id',
      type: 'text',
      content: { message: 'Hello world' },
      sender: { communicationUserId: 'user-id', kind: 'communicationUser' },
      senderDisplayName: 'User Name',
      createdOn: new Date(),
      sequenceId: '1',
      version: '1'
    };

    mockParticipantAddedMessage = {
      id: 'participant-message-id',
      type: 'participantAdded',
      content: {
        initiator: { communicationUserId: 'user-id', kind: 'communicationUser' },
        participants: [{ id: { communicationUserId: 'participant-id' }, displayName: 'Participant Name' }]
      },
      senderDisplayName: 'User Name',
      createdOn: new Date(),
      sequenceId: '2',
      version: '1'
    };

    mockParticipantRemovedMessage = {
      id: 'participant-remove-message-id',
      type: 'participantRemoved',
      content: {
        initiator: { communicationUserId: 'user-id', kind: 'communicationUser' },
        participants: [{ id: { communicationUserId: 'participant-id' }, displayName: 'Participant Name' }]
      },
      senderDisplayName: 'User Name',
      createdOn: new Date(),
      sequenceId: '3',
      version: '1'
    };

    mockActivity = {
      type: 'message',
      id: 'activity-id',
      messageid: 'message-id',
      from: { id: 'user-id', name: 'User Name' },
      text: 'Hello world',
      timestamp: '2025-10-10T15:55:09Z',
      channelData: {}
    } as ACSDirectLineActivity;

    // Mock function implementations
    (isChatMessageTypeSupported as jest.Mock).mockReturnValue(true);
    (createHistoryMessageToDirectLineActivityMapper as jest.Mock).mockReturnValue(() => () => mockActivity);
    (convertThreadUpdate as jest.Mock).mockResolvedValue(mockActivity);
    (processParticipants as jest.Mock).mockImplementation(() => {});
  });

  describe('processHistoryMessage', () => {
    test('should return false for unsupported message types', async () => {
      (isChatMessageTypeSupported as jest.Mock).mockReturnValue(false);

      const result = await processHistoryMessage(
        pagedHistoryMessagesBeforeWebChatInit,
        mockTextMessage,
        'Test log',
        false,
        getState,
        next
      );

      expect(result).toBe(false);
      expect(next).not.toHaveBeenCalled();
    });

    test('should cache messages when WebChat is not connected', async () => {
      getState.mockImplementation((key: StateKey) => {
        if (key === StateKey.WebChatStatus) {
          return ConnectionStatus.Connecting;
        }
        return undefined;
      });

      const result = await processHistoryMessage(
        pagedHistoryMessagesBeforeWebChatInit,
        mockTextMessage,
        'Test log',
        false,
        getState,
        next
      );

      expect(result).toBe(true);
      expect(pagedHistoryMessagesBeforeWebChatInit).toContain(mockTextMessage);
      expect(next).not.toHaveBeenCalled();
    });

    test('should process text messages when WebChat is connected', async () => {
      const result = await processHistoryMessage(
        pagedHistoryMessagesBeforeWebChatInit,
        mockTextMessage,
        'Test log',
        false,
        getState,
        next
      );

      expect(result).toBe(true);
      expect(next).toHaveBeenCalledWith(mockActivity);
    });

    test('should not call next if unsubscribed is true for text messages', async () => {
      const result = await processHistoryMessage(
        pagedHistoryMessagesBeforeWebChatInit,
        mockTextMessage,
        'Test log',
        true,
        getState,
        next
      );

      expect(result).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });

    test('should process participantAdded messages when WebChat is connected', async () => {
      const result = await processHistoryMessage(
        pagedHistoryMessagesBeforeWebChatInit,
        mockParticipantAddedMessage,
        'Test log',
        false,
        getState,
        next
      );

      expect(result).toBe(true);
      expect(processParticipants).toHaveBeenCalledWith(
        mockParticipantAddedMessage.content?.participants,
        Constants.PARTICIPANT_JOINED,
        getState,
        next
      );
    });

    test('should process participantRemoved messages when WebChat is connected', async () => {
      const result = await processHistoryMessage(
        pagedHistoryMessagesBeforeWebChatInit,
        mockParticipantRemovedMessage,
        'Test log',
        false,
        getState,
        next
      );

      expect(result).toBe(true);
      expect(processParticipants).toHaveBeenCalledWith(
        mockParticipantRemovedMessage.content?.participants,
        Constants.PARTICIPANT_LEFT,
        getState,
        next
      );
    });
  });

  describe('convertAndProcessHistoryMessageByType', () => {
    test('should process text messages correctly', async () => {
      await convertAndProcessHistoryMessageByType(mockTextMessage, getState, next, 'Test log');

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockActivity.id,
          type: 'message',
          messageid: mockTextMessage.id,
          text: mockTextMessage.content?.message,
          from: {
            id: (mockTextMessage.sender as CommunicationUserIdentifier).communicationUserId,
            name: mockTextMessage.senderDisplayName
          },
          timestamp: mockActivity.timestamp,
          channelData: {
            fromList: true
          }
        })
      );
    });

    test('should process participantAdded messages correctly', async () => {
      mockActivity = {
        text: 'Mock activity',
        channelId: 'test',
        conversation: { id: 'test-conversation' },
        from: { id: 'id-string', name: undefined, role: Role.Channel },
        timestamp: '2025-05-01T23:12:01.150Z',
        type: ActivityType.Message
      };
      (convertThreadUpdate as jest.Mock).mockResolvedValue(mockActivity);

      await convertAndProcessHistoryMessageByType(
        mockParticipantAddedMessage,
        getState,
        next,
        Constants.PARTICIPANT_JOINED
      );

      expect(convertThreadUpdate).toHaveBeenCalledWith(
        getState,
        mockParticipantAddedMessage.content?.participants?.[0],
        Constants.PARTICIPANT_JOINED
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockActivity,
          channelData: { fromList: true }
        })
      );
    });

    test('should not call next if activity is invalid', async () => {
      (createHistoryMessageToDirectLineActivityMapper as jest.Mock).mockReturnValue(
        () => (): ACSDirectLineActivity | undefined => undefined
      );
      (convertThreadUpdate as jest.Mock).mockResolvedValue(undefined);

      await convertAndProcessHistoryMessageByType(mockTextMessage, getState, next, 'Test log');

      expect(next).not.toHaveBeenCalled();
    });

    test('should process participantRemoved messages correctly', async () => {
      mockActivity = {
        text: 'Mock activity',
        channelId: 'test',
        conversation: { id: 'test-conversation' },
        from: { id: 'id-string', name: undefined, role: Role.Channel },
        timestamp: '2025-05-01T23:12:01.150Z',
        type: ActivityType.Message
      };
      (convertThreadUpdate as jest.Mock).mockResolvedValue(mockActivity);

      await convertAndProcessHistoryMessageByType(
        mockParticipantRemovedMessage,
        getState,
        next,
        Constants.PARTICIPANT_LEFT
      );

      expect(convertThreadUpdate).toHaveBeenCalledWith(
        getState,
        mockParticipantRemovedMessage.content?.participants?.[0],
        Constants.PARTICIPANT_LEFT
      );
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockActivity,
          channelData: { fromList: true }
        })
      );
    });
  });
});
