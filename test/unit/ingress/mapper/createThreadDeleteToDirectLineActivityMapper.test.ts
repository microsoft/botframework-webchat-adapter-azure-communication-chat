import { ActivityType, IDirectLineActivity, Role } from '../../../../src/types/DirectLineTypes';
import { ChannelDataTypes } from '../../../../src/types/ChannelDataTypes';
import { MockMiddlewareTemplate } from '../../mocks/AdapterMock';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import createThreadDeleteToDirectLineActivityMapper from '../../../../src/ingress/mappers/createThreadDeleteToDirectLineActivityMapper';
import { ChatThreadDeletedEvent } from '@azure/communication-chat';

jest.mock('../../../../src/utils/ClientIdToMessageId', () => {
  return {
    getClientId: (messageId: string) => messageId
  };
});

const adapterMock = MockMiddlewareTemplate();
const adapterMockAdaptivsCard = MockMiddlewareTemplate();
const next = jest.fn();
const mockThreadId = 'mockThreadId';

adapterMock.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatClient) {
    return {};
  }
  if (stateKey === StateKey.ChatThreadClient) {
    return {
      getMessage: jest.fn()
    };
  }
  if (stateKey === StateKey.EventManager) {
    return {
      handleError: jest.fn()
    };
  }
  if (stateKey === StateKey.ThreadId) {
    return mockThreadId;
  }
};

adapterMockAdaptivsCard.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatClient) {
    return {};
  }
  if (stateKey === StateKey.AdapterOptions) {
    return {
      enableAdaptiveCards: true
    };
  }
  if (stateKey === StateKey.ChatThreadClient) {
    return {
      getMessage: jest.fn()
    };
  }
  if (stateKey === StateKey.EventManager) {
    return {
      handleError: jest.fn()
    };
  }
};

describe('createThreadDeleteToDirectLineActivityMapper tests', () => {
  beforeEach(() => {
    next.mockClear();
  });

  test('should be able to return activity with thread deleted', async (): Promise<void> => {
    const threadDeleteEvent: ChatThreadDeletedEvent = GenerateThreadDeletedEvent();
    const expectedResult: IDirectLineActivity = ExpectedResult();
    const result = await createThreadDeleteToDirectLineActivityMapper(adapterMock)(next)(threadDeleteEvent);
    expect(result).toEqual(expectedResult);
  });
});

function GenerateThreadDeletedEvent(): ChatThreadDeletedEvent {
  return {
    deletedBy: { id: { kind: 'communicationUser', communicationUserId: 'test' }, displayName: 'test', metadata: {} },
    deletedOn: new Date('01-01-2020'),
    threadId: 'test',
    version: 'test'
  };
}

function ExpectedResult(): IDirectLineActivity {
  return {
    channelId: 'ACS_CHANNEL',
    channelData: {
      properties: {
        deleteTime: new Date('01-01-2020').toISOString(),
        isDeleted: 'True'
      },
      type: ChannelDataTypes.THREAD
    },
    conversation: { id: undefined },
    from: { id: undefined, name: undefined, role: Role.Channel },
    id: undefined,
    timestamp: new Date('01-01-2020').toISOString(),
    type: ActivityType.Message,
    messageid: undefined
  };
}
