import { ActivityType, IDirectLineActivity, Role } from '../../../../src/types/DirectLineTypes';

import { ChatMessage } from '@azure/communication-chat';
import { MockMiddlewareTemplate } from '../../mocks/AdapterMock';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import createHistoryMessageToDirectLineActivityMapper from '../../../../src/ingress/mappers/createHistoryMessageToDirectLineActivityMapper';

jest.mock('../../../../src/utils/ClientIdToMessageId', () => {
  return {
    getClientId: (messageId: string) => messageId
  };
});

const adapterMock = MockMiddlewareTemplate();
const adapterMockAdaptivsCard = MockMiddlewareTemplate();
const next = jest.fn();

const testMessageId = '44';
const testMessageIdAsInt = parseInt(testMessageId);

const mockMetaDataWithTags = {
  key: 'value',
  tags: '["tag1", "tag2"]'
};

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
  if (stateKey === StateKey.FileManager) {
    return {
      getFileIds: jest.fn(() => {
        return null;
      }),
      getFileMetadata: jest.fn(() => {
        return null;
      })
    };
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

describe('createHistoryMessageToDirectLineActivityMapper tests', () => {
  beforeEach(() => {
    next.mockClear();
  });

  test('should be able to return activity with sequence id', async (): Promise<void> => {
    const content = 'test message';
    const message: ChatMessage = GenerateMessage(content, mockMetaDataWithTags, '1');
    const expectedResult: IDirectLineActivity = ExpectedResult(
      content,
      undefined,
      mockMetaDataWithTags,
      mockMetaDataWithTags.tags,
      testMessageIdAsInt
    );
    const result = await createHistoryMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should be able to return activity with editedOn value', async (): Promise<void> => {
    const content = 'test message';
    const editedOn = new Date('01-01-2025');
    const message: ChatMessage = GenerateMessage(content, mockMetaDataWithTags, '1', editedOn);
    const expectedResult: IDirectLineActivity = ExpectedResult(
      content,
      undefined,
      mockMetaDataWithTags,
      mockMetaDataWithTags.tags,
      testMessageIdAsInt,
      editedOn.toISOString()
    );
    const result = await createHistoryMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should be able to return activity with deletedOn value', async (): Promise<void> => {
    const content = 'test message';
    const deletedOn = new Date('01-01-2025');
    const message: ChatMessage = GenerateMessage(content, mockMetaDataWithTags, '1', undefined, deletedOn);
    const expectedResult: IDirectLineActivity = ExpectedResult(
      content,
      undefined,
      mockMetaDataWithTags,
      mockMetaDataWithTags.tags,
      testMessageIdAsInt,
      undefined,
      deletedOn.toISOString()
    );
    const result = await createHistoryMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should be able to return activity with sequence id for 2^64 (max value for uint) ', async (): Promise<void> => {
    const content = 'test message';
    const message: ChatMessage = GenerateMessage(content, mockMetaDataWithTags, '18446744073709552000');
    const expectedResult: IDirectLineActivity = ExpectedResult(
      content,
      undefined,
      mockMetaDataWithTags,
      mockMetaDataWithTags.tags,
      testMessageIdAsInt
    );
    const result = await createHistoryMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should be able to return sequence id as undefined when invalid (negative)', async (): Promise<void> => {
    const content = 'test message';
    const message: ChatMessage = GenerateMessage(content, mockMetaDataWithTags, '-1');
    const expectedResult: IDirectLineActivity = ExpectedResult(
      content,
      undefined,
      mockMetaDataWithTags,
      mockMetaDataWithTags.tags,
      testMessageIdAsInt
    );
    const result = await createHistoryMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should be able to return sequence id as undefined when invalid (NAN)', async (): Promise<void> => {
    const content = 'test message';
    const message: ChatMessage = GenerateMessage(content, mockMetaDataWithTags, 'hello');
    const expectedResult: IDirectLineActivity = ExpectedResult(
      content,
      undefined,
      mockMetaDataWithTags,
      mockMetaDataWithTags.tags,
      testMessageIdAsInt
    );
    const result = await createHistoryMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });
});

function GenerateMessage(
  content: string,
  metadata: Record<string, string>,
  sequenceId?: string,
  editedOn?: Date,
  deletedOn?: Date
): ChatMessage {
  return {
    content: { message: content },
    type: 'text',
    sequenceId: sequenceId,
    sender: { kind: 'communicationUser', communicationUserId: 'test' },
    senderDisplayName: 'testName',
    id: testMessageId,
    createdOn: new Date('01-01-2020'),
    version: '1',
    metadata: metadata,
    editedOn,
    deletedOn
  };
}

function ExpectedResult(
  // attachments?: any[],
  content?: string,
  value?: string,
  metadata?: Record<string, string>,
  // attachmentSizes?: number[],
  tags?: string,
  sequenceId?: number,
  editedOn?: string,
  deletedOn?: string
): IDirectLineActivity {
  return {
    attachmentLayout: undefined,
    attachments: undefined,
    channelId: 'ACS_CHANNEL',
    channelData: {
      'webchat:sequence-id': sequenceId,
      fromUserId: 'test',
      clientActivityID: testMessageId,
      messageId: testMessageId,
      state: 'sent',
      tags: tags,
      metadata: metadata,
      attachmentSizes: undefined,
      additionalMessageMetadata: {
        deletedOn: deletedOn,
        editedOn: editedOn
      }
    },
    conversation: { id: mockThreadId },
    from: { id: 'test', name: 'testName', role: Role.Bot },
    id: testMessageId,
    text: content,
    timestamp: new Date('01-01-2020').toISOString(),
    type: ActivityType.Message,
    messageid: testMessageId,
    value,
    suggestedActions: undefined
  };
}
