import createDeletedMessageEventToDirectLineActivityMapper from '../../../../src/ingress/mappers/createDeletedMessageEventToDirectLineActivityMapper';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import { ActivityType, Role } from '../../../../src/types/DirectLineTypes';
import { ChatClient, ChatMessageDeletedEvent } from '@azure/communication-chat';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Constants } from '../../../../src/Constants';

// Mock uniqueId to return a predictable value for testing
jest.mock('../../../../src/utils/uniqueId', () => ({
  __esModule: true,
  default: jest.fn(() => 'mocked-unique-id')
}));

// Mock getIdFromIdentifier
jest.mock('../../../../src/ingress/ingressHelpers', () => ({
  getIdFromIdentifier: (identifier: CommunicationUserIdentifier) => identifier.communicationUserId
}));

describe('createDeletedMessageEventToDirectLineActivityMapper', () => {
  let mockGetState: jest.Mock;
  let mockChatClient: Partial<ChatClient>;
  let mapper: ReturnType<typeof createDeletedMessageEventToDirectLineActivityMapper>;

  const mockUserId = 'user-id-123';
  const mockBotId = 'bot-id-456';

  beforeEach(() => {
    mockChatClient = {} as Partial<ChatClient>;

    mockGetState = jest.fn((key: StateKey) => {
      if (key === StateKey.ChatClient) {
        return mockChatClient;
      } else if (key === StateKey.UserId) {
        return mockUserId;
      }
      return undefined;
    });

    mapper = createDeletedMessageEventToDirectLineActivityMapper({ getState: mockGetState });
  });

  test('should throw an error if chat client is not available', async () => {
    mockGetState.mockImplementation((key: StateKey) => {
      if (key === StateKey.UserId) {
        return mockUserId;
      }
      return undefined;
    });

    const mockEvent = {
      id: '123',
      sender: { communicationUserId: mockUserId } as CommunicationUserIdentifier,
      senderDisplayName: 'Test User',
      deletedOn: new Date('2023-01-01T12:00:00Z'),
      createdOn: new Date('2023-01-01T10:00:00Z')
    } as ChatMessageDeletedEvent;

    await expect(mapper()(mockEvent)).rejects.toThrow(
      'ACS Adapter: Failed to ingress deleted message without an active chatClient.'
    );
  });

  test('should map a deleted message event from the user to a DirectLine activity', async () => {
    const mockEvent = {
      id: '123',
      sender: { communicationUserId: mockUserId } as CommunicationUserIdentifier,
      senderDisplayName: 'Test User',
      deletedOn: new Date('2023-01-01T12:00:00Z'),
      createdOn: new Date('2023-01-01T10:00:00Z')
    } as ChatMessageDeletedEvent;

    const activity = await mapper()(mockEvent);

    expect(activity).toEqual({
      channelId: Constants.ACS_CHANNEL,
      channelData: {
        'webchat:sequence-id': 123,
        additionalMessageMetadata: {
          deletedOn: '2023-01-01T12:00:00.000Z'
        }
      },
      conversation: { id: mockUserId },
      from: {
        id: mockUserId,
        name: 'Test User',
        role: Role.User
      },
      messageid: '123',
      id: '123',
      text: '',
      timestamp: '2023-01-01T10:00:00.000Z',
      type: ActivityType.Message
    });
  });

  test('should map a deleted message event from the bot to a DirectLine activity', async () => {
    const mockEvent = {
      id: '456',
      sender: { communicationUserId: mockBotId } as CommunicationUserIdentifier,
      senderDisplayName: 'Bot Name',
      deletedOn: new Date('2023-01-01T12:00:00Z'),
      createdOn: new Date('2023-01-01T10:00:00Z')
    } as ChatMessageDeletedEvent;

    const activity = await mapper()(mockEvent);

    expect(activity).toEqual({
      channelId: Constants.ACS_CHANNEL,
      channelData: {
        'webchat:sequence-id': 456,
        additionalMessageMetadata: {
          deletedOn: '2023-01-01T12:00:00.000Z'
        }
      },
      conversation: { id: mockUserId },
      from: {
        id: mockBotId,
        name: 'Bot Name',
        role: Role.Bot
      },
      messageid: '456',
      id: '456',
      text: '',
      timestamp: '2023-01-01T10:00:00.000Z',
      type: ActivityType.Message
    });
  });

  test('should generate a unique ID if event ID is not provided', async () => {
    const mockEvent = {
      id: undefined,
      sender: { communicationUserId: mockUserId } as CommunicationUserIdentifier,
      senderDisplayName: 'Test User',
      deletedOn: new Date('2023-01-01T12:00:00Z'),
      createdOn: new Date('2023-01-01T10:00:00Z')
    } as ChatMessageDeletedEvent;

    const activity = await mapper()(mockEvent);

    expect(activity).not.toBeUndefined();
    if (activity) {
      expect(activity.id).toBe('mocked-unique-id');
    }
  });
});
