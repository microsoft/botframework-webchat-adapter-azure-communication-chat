import createEgressTypingActivityMiddleware from '../../../src/egress/createEgressTypingActivityMiddleware';
import { ActivityType, IDirectLineActivity, Role } from '../../../src/types/DirectLineTypes';
import { StateKey } from '../../../src/models/ACSAdapterState';
import { MockMiddlewareTemplate } from '../mocks/AdapterMock';

const mockSetMessageIdToClientId = jest.fn();

jest.mock('../../../src/utils/ClientIdToMessageId', () => {
  return {
    setMessageIdToClientId: (messageId: string, clientId: string) => mockSetMessageIdToClientId(messageId, clientId)
  };
});

const adapterMock = MockMiddlewareTemplate();
const adapterMockEnableSenderDisplayName = MockMiddlewareTemplate();
const next = jest.fn();

const mocksendTypingNotification = jest.fn().mockResolvedValue({});

const MockChatThreadClient = (): any => {
  return {
    sendTypingNotification: mocksendTypingNotification
  };
};

const activity: IDirectLineActivity = {
  channelId: 'emptyChannelId',
  channelData: {
    clientActivityID: 'clientActivityID'
  },
  conversation: { id: 'mockThreadId' },
  from: {
    id: 'user1',
    role: Role.User
  },
  id: 'test id',
  text: 'test message',
  timestamp: new Date('01-01-2020').toISOString(),
  type: ActivityType.Message,
  messageid: 'test messageId'
};

adapterMock.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatThreadClient) {
    return MockChatThreadClient();
  }
  if (stateKey === StateKey.UserDisplayName) {
    return 'user';
  }
};

adapterMockEnableSenderDisplayName.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatThreadClient) {
    return MockChatThreadClient();
  }
  if (stateKey === StateKey.UserDisplayName) {
    return 'user';
  }

  if (stateKey === StateKey.AdapterOptions) {
    return {
      enableSenderDisplayNameInTypingNotification: true
    };
  }
};

describe('createEgressTypingActivityMiddleware tests', () => {
  beforeEach(() => {
    mocksendTypingNotification.mockClear();
    next.mockClear();
  });

  test('should send typing notification when activity type is typing', async (): Promise<void> => {
    const otherActivity = { ...activity, type: ActivityType.Typing };
    const egressFunction = createEgressTypingActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }
    await egressFunction(otherActivity);
    expect(mocksendTypingNotification).toHaveBeenCalledTimes(1);
  });

  test('should send typing notification with sender displayname when enble', async (): Promise<void> => {
    const otherActivity = { ...activity, type: ActivityType.Typing };
    const egressFunction = createEgressTypingActivityMiddleware()(adapterMockEnableSenderDisplayName)(next);
    if (!egressFunction) {
      return;
    }
    await egressFunction(otherActivity);
    expect(mocksendTypingNotification).toHaveBeenCalledTimes(1);
    expect(mocksendTypingNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        senderDisplayName: 'user'
      })
    );
  });

  test('should not send typing notification when activity type is not typing', async (): Promise<void> => {
    const otherActivity = { ...activity, type: ActivityType.Message };
    const egressFunction = createEgressTypingActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }
    await egressFunction(otherActivity);
    expect(mocksendTypingNotification).toHaveBeenCalledTimes(0);
  });
});
