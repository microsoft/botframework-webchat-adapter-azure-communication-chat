import {
  ActivityType,
  DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
  IDirectLineActivity,
  Role
} from '../../../../src/types/DirectLineTypes';

import { ChatMessageReceivedEvent, StreamingMessageMetadata } from '@azure/communication-chat';
import { MockMiddlewareTemplate } from '../../mocks/AdapterMock';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import createUserMessageToDirectLineActivityMapper from '../../../../src/ingress/mappers/createUserMessageToDirectLineActivityMapper';
import { getDataURL } from '../../../../src/ingress/ingressHelpers';

jest.mock('../../../../src/utils/ClientIdToMessageId', () => {
  return {
    getClientId: (messageId: string) => messageId
  };
});

const adapterMock = MockMiddlewareTemplate();
const next = jest.fn();
const mockMetadata = {
  key: 'value'
};

const mockMetaDataWithTags = {
  key: 'value',
  tags: '["tag1", "tag2"]'
};

const mockFileIds = ['id1'];
const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
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

describe('createUserMessageToDirectLineActivityMapper tests', () => {
  beforeEach(() => {
    next.mockClear();
  });

  test('should be able to return activity with valid tags', async (): Promise<void> => {
    const content = 'test message';
    const message: ChatMessageReceivedEvent = GenerateMessage(content, mockMetaDataWithTags);
    const expectedResult: IDirectLineActivity = ExpectedResult(
      undefined,
      content,
      undefined,
      mockMetaDataWithTags,
      undefined,
      mockMetaDataWithTags.tags
    );
    const result = await createUserMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should be able to return activity with text message', async (): Promise<void> => {
    const content = 'test message';
    const message: ChatMessageReceivedEvent = GenerateMessage(content, mockMetadata);
    const expectedResult: IDirectLineActivity = ExpectedResult(undefined, content, undefined, mockMetadata);
    const result = await createUserMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should be able to return activity with attachments', async (): Promise<void> => {
    // Mock out the file download
    const modifiedAdapterMock = { ...adapterMock };
    modifiedAdapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.ChatClient) {
        return {};
      }
      if (stateKey === StateKey.FileManager) {
        return {
          getFileIds: jest.fn(() => {
            return [mockFileIds];
          }),
          getFileMetadata: jest.fn(() => {
            return [mockMetadata];
          }),
          downloadFiles: jest.fn(() => {
            return [mockFile];
          })
        };
      }
      if (stateKey === StateKey.EventManager) {
        return {
          handleError: jest.fn()
        };
      }
    };

    const message = GenerateMessage('hello', mockMetadata);
    const attachments = [
      {
        contentType: mockFile.type,
        contentUrl: await getDataURL(mockFile),
        name: mockFile.name
      }
    ];
    const attachmentSizes = [mockFile.size];
    const expectedResult = ExpectedResult(attachments, 'hello', undefined, mockMetadata, attachmentSizes);
    const result = await createUserMessageToDirectLineActivityMapper(modifiedAdapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should throw error when no chat client is available', async (): Promise<void> => {
    const modifiedAdapterMock = { ...adapterMock };
    modifiedAdapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.ChatClient) {
        return null; // Return null to simulate no chat client
      }
      return adapterMock.getState(stateKey);
    };

    const content = 'test message';
    const message: ChatMessageReceivedEvent = GenerateMessage(content, mockMetadata);

    await expect(createUserMessageToDirectLineActivityMapper(modifiedAdapterMock)(next)(message)).rejects.toThrow(
      'ACS Adapter: Failed to ingress message without an active chatClient.'
    );
  });

  test('should handle error when attachments not found', async (): Promise<void> => {
    const handleErrorMock = jest.fn();

    // Mock state with file IDs that will cause error during download
    const errorAdapterMock = { ...adapterMock };
    errorAdapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.ChatClient) {
        return {};
      }
      if (stateKey === StateKey.FileManager) {
        return {
          getFileIds: jest.fn().mockImplementation(() => {
            throw new Error('No file ids found');
          })
        };
      }
      if (stateKey === StateKey.EventManager) {
        return {
          handleError: handleErrorMock
        };
      }
      if (stateKey === StateKey.AdapterOptions) {
        return { enableMessageErrorHandler: true };
      }
      return adapterMock.getState(stateKey);
    };
    const message = GenerateMessage('hello with attachment', mockMetadata);
    const result = await createUserMessageToDirectLineActivityMapper(errorAdapterMock)(next)(message);

    expect(handleErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to download attachments.'
      })
    );
    expect(result).toBeDefined();
    if (result) {
      expect(result.text).toBe('hello with attachment');
      expect(result.attachments).toBeUndefined();
    }
  });

  test('should handle message with streaming metadata', async (): Promise<void> => {
    const streamingMetadata: StreamingMessageMetadata = { streamingMessageType: 'final', streamEndReason: 'completed' };
    const content = 'streaming message';
    const message: ChatMessageReceivedEvent = GenerateMessage(content, mockMetadata, streamingMetadata);
    const expectedResult = ExpectedResult(undefined, content, undefined, mockMetadata);
    if (streamingMetadata?.streamingMessageType) {
      expectedResult.entities = [
        {
          type: DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
          streamType: streamingMetadata.streamingMessageType,
          streamId: '44'
        }
      ];
      expectedResult.channelData = {
        ...expectedResult.channelData,
        streamType: streamingMetadata.streamingMessageType,
        streamId: '44'
      };
    }
    const result = await createUserMessageToDirectLineActivityMapper(adapterMock)(next)(message);
    expect(result).toEqual(expectedResult);
  });

  test('should handle empty metadata', async (): Promise<void> => {
    const content = 'test message';
    const message: ChatMessageReceivedEvent = GenerateMessage(content, {});

    const expectedResult = ExpectedResult(undefined, content, undefined, undefined);
    const result = await createUserMessageToDirectLineActivityMapper(adapterMock)(next)(message);

    expect(result).toEqual(expectedResult);
  });

  test('should not attempt to download attachments when metadata has no file IDs', async (): Promise<void> => {
    const fileManagerMock = {
      getFileIds: jest.fn(() => null),
      getFileMetadata: jest.fn(() => null),
      downloadFiles: jest.fn()
    };
    const modifiedAdapterMock = { ...adapterMock };
    modifiedAdapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.ChatClient) {
        return {};
      }
      if (stateKey === StateKey.FileManager) {
        return fileManagerMock;
      }
      return adapterMock.getState(stateKey);
    };
    jest.mock('../../../../src/ingress/ingressHelpers', () => ({
      downloadAttachments: jest.fn()
    }));
    const content = 'message without attachments';
    const message: ChatMessageReceivedEvent = GenerateMessage(content, mockMetadata);
    await createUserMessageToDirectLineActivityMapper(modifiedAdapterMock)(next)(message);
    expect(fileManagerMock.getFileIds).toHaveBeenCalledWith(mockMetadata);
    expect(fileManagerMock.getFileMetadata).toHaveBeenCalledWith(mockMetadata);
    expect(fileManagerMock.downloadFiles).not.toHaveBeenCalled();
  });
});

function GenerateMessage(
  content: string,
  metadata: Record<string, string>,
  streamingMetadata?: StreamingMessageMetadata
): ChatMessageReceivedEvent {
  return {
    message: content,
    type: '',
    threadId: mockThreadId,
    sender: { kind: 'communicationUser', communicationUserId: 'test' },
    recipient: { kind: 'communicationUser', communicationUserId: 'test' },
    senderDisplayName: '',
    id: '44',
    createdOn: new Date('01-01-2020'),
    version: '1',
    metadata: metadata,
    streamingMetadata
  };
}

function ExpectedResult(
  attachments?: any[],
  content?: string,
  value?: any,
  metadata?: Record<string, string>,
  attachmentSizes?: number[],
  tags?: string,
  attachmentLayout?: string
): IDirectLineActivity {
  return {
    attachments,
    channelId: 'ACS_CHANNEL',
    channelData: {
      fromUserId: 'test',
      clientActivityID: '44',
      messageId: '44',
      state: 'sent',
      ...(tags && { tags }),
      ...(metadata && { metadata }),
      ...(attachmentSizes && { attachmentSizes }),
      'webchat:sequence-id': 44,
      additionalMessageMetadata: {}
    },
    conversation: { id: mockThreadId },
    from: { id: 'test', name: undefined, role: Role.Bot },
    id: '44',
    text: content,
    timestamp: new Date('01-01-2020').toISOString(),
    type: ActivityType.Message,
    messageid: '44',
    value,
    suggestedActions: undefined,
    attachmentLayout
  };
}
