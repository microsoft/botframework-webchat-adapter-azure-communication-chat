import createTypingMessageToDirectLineActivityMapper from '../../../../src/ingress/mappers/createTypingMessageToDirectLineActivityMapper';
import { ActivityType, IDirectLineActivity, Role } from '../../../../src/types/DirectLineTypes';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import { MockMiddlewareTemplate } from '../../mocks/AdapterMock';
import { TypingIndicatorReceivedEvent } from '@azure/communication-chat';

jest.mock('../../../../src/utils/ClientIdToMessageId', () => {
  return {
    getClientId: (messageId: string) => messageId
  };
});

const adapterMock = MockMiddlewareTemplate();
const next = jest.fn();

adapterMock.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatClient) {
    return {};
  }
};

describe('createTypingMessageToDirectLineActivityMapper tests', () => {
  beforeEach(() => {
    next.mockClear();
  });

  test('should be able to return activity with typing message', async (): Promise<void> => {
    const senderID = 'Inderpal_ID';
    const senderDisplayName = 'Inderpal';
    const receiverID = 'Xiaofeng_ID';
    const message: TypingIndicatorReceivedEvent = GenerateMessage(senderID, senderDisplayName, receiverID);
    const expectedResult: IDirectLineActivity = ExpectedResult(senderID, senderDisplayName);
    const result = await createTypingMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  function GenerateMessage(
    senderID: string,
    senderDisplayName: string,
    receiverID: string
  ): TypingIndicatorReceivedEvent {
    return {
      version: '',
      receivedOn: new Date('01-01-2020'),
      threadId: '',
      sender: { kind: 'communicationUser', communicationUserId: senderID },
      senderDisplayName: senderDisplayName,
      recipient: { kind: 'communicationUser', communicationUserId: receiverID }
    };
  }

  function ExpectedResult(senderID: string, senderName: string): IDirectLineActivity {
    return {
      channelId: 'ACS_CHANNEL',
      conversation: { id: undefined },
      from: {
        id: senderID,
        name: senderName,
        role: Role.Bot
      },
      timestamp: new Date('01-01-2020').toISOString(),
      type: ActivityType.Typing
    };
  }
});
