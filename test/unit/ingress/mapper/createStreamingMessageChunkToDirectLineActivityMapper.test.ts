import {
  ActivityType,
  DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
  IDirectLineActivity,
  Role
} from '../../../../src/types/DirectLineTypes';

import { StreamingChatMessageChunkReceivedEvent, StreamingMessageMetadata } from '@azure/communication-chat';
import { MockMiddlewareTemplate } from '../../mocks/AdapterMock';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import { createStreamingMessageChunkToDirectLineActivityMapper } from '../../../../src/ingress/mappers/createStreamingMessageChunkToDirectLineActivityMapper';

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

const mockThreadId = 'mockThreadId';

adapterMock.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatClient) {
    return {};
  }
  if (stateKey === StateKey.ThreadId) {
    return mockThreadId;
  }
  if (stateKey === StateKey.FileManager) {
    return {
      getFileIds: jest.fn(() => {
        return [];
      }),
      getFileMetadata: jest.fn(() => {
        return [];
      }),
      downloadFiles: jest.fn(() => {
        return [];
      })
    };
  }
};

describe('createStreamingMessageChunkToDirectLineActivityMapper tests', () => {
  beforeEach(() => {
    next.mockClear();
  });

  test('should be able to return activity for informative message when it`s a first chunk', async (): Promise<void> => {
    const content = 'test message';
    const streamingMetadata: StreamingMessageMetadata = {
      streamingMessageType: 'informative',
      streamingSequenceNumber: 1
    };
    const message = generateMessage(content, {}, streamingMetadata);
    const expectedResultValue: IDirectLineActivity = {
      channelId: 'ACS_CHANNEL',
      channelData: {
        'webchat:sequence-id': 44,
        streamType: streamingMetadata.streamingMessageType ?? '',
        streamSequence: streamingMetadata.streamingSequenceNumber ?? -1
      },
      conversation: { id: mockThreadId },
      from: { id: 'test', name: undefined, role: Role.Bot },
      id: '44',
      text: content,
      timestamp: new Date('02-01-2020').toISOString(),
      type: ActivityType.Typing,
      messageid: '44',
      entities: [
        {
          type: DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
          streamType: streamingMetadata.streamingMessageType ?? '',
          streamSequence: streamingMetadata.streamingSequenceNumber ?? -1
        }
      ]
    };
    const result = await createStreamingMessageChunkToDirectLineActivityMapper({ ...adapterMock, isFirstChunk: true })(
      next
    )(message);
    expect(result).toEqual(expectedResultValue);
  });

  test('should be able to return activity for streaming message when it`s a first chunk', async (): Promise<void> => {
    const content = 'test message';
    const streamingMetadata: StreamingMessageMetadata = {
      streamingMessageType: 'streaming',
      streamingSequenceNumber: 0
    };
    const message = generateMessage(content, {}, streamingMetadata);
    const expectedResultValue: IDirectLineActivity = {
      channelId: 'ACS_CHANNEL',
      channelData: {
        'webchat:sequence-id': 44,
        streamType: streamingMetadata.streamingMessageType ?? '',
        streamSequence: streamingMetadata.streamingSequenceNumber ?? -1
      },
      conversation: { id: mockThreadId },
      from: { id: 'test', name: undefined, role: Role.Bot },
      id: '44',
      text: content,
      timestamp: new Date('02-01-2020').toISOString(),
      type: ActivityType.Typing,
      messageid: '44',
      entities: [
        {
          type: DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
          streamType: streamingMetadata.streamingMessageType ?? '',
          streamSequence: streamingMetadata.streamingSequenceNumber ?? -1
        }
      ]
    };
    const result = await createStreamingMessageChunkToDirectLineActivityMapper({ ...adapterMock, isFirstChunk: true })(
      next
    )(message);
    expect(result).toEqual(expectedResultValue);
  });

  test('should be able to return activity with text message and informative streaming type', async (): Promise<void> => {
    const content = 'test message';
    const streamingMetadata: StreamingMessageMetadata = {
      streamingMessageType: 'informative',
      streamingSequenceNumber: 2
    };
    const message = generateMessage(content, mockMetadata, streamingMetadata);
    const expectedResultValue = expectedResult(mockMetadata, streamingMetadata, undefined, content);
    const result = await createStreamingMessageChunkToDirectLineActivityMapper({ ...adapterMock, isFirstChunk: false })(
      next
    )(message);
    expect(result).toEqual(expectedResultValue);
  });

  test('should be able to return activity with text message and streaming streaming type', async (): Promise<void> => {
    const content = 'test message';
    const streamingMetadata: StreamingMessageMetadata = {
      streamingMessageType: 'streaming',
      streamingSequenceNumber: 10
    };
    const message = generateMessage(content, mockMetadata, streamingMetadata);
    const expectedResultValue = expectedResult(mockMetadata, streamingMetadata, undefined, content);
    const result = await createStreamingMessageChunkToDirectLineActivityMapper({ ...adapterMock, isFirstChunk: false })(
      next
    )(message);
    expect(result).toEqual(expectedResultValue);
  });

  test('should be able to return activity with valid tags', async (): Promise<void> => {
    const content = 'test message';
    const streamingMetadata: StreamingMessageMetadata = {
      streamingMessageType: 'streaming',
      streamingSequenceNumber: 1
    };
    const message = generateMessage(content, mockMetaDataWithTags, streamingMetadata);
    const expectedResultValue = expectedResult(
      mockMetaDataWithTags,
      streamingMetadata,
      mockMetaDataWithTags.tags,
      content
    );
    const result = await createStreamingMessageChunkToDirectLineActivityMapper({ ...adapterMock, isFirstChunk: false })(
      next
    )(message);
    expect(result).toEqual(expectedResultValue);
  });

  const generateMessage = (
    content: string,
    metadata: Record<string, string>,
    streamingMetadata: StreamingMessageMetadata
  ): StreamingChatMessageChunkReceivedEvent => {
    return {
      message: content,
      type: '',
      threadId: mockThreadId,
      sender: { kind: 'communicationUser', communicationUserId: 'test' },
      recipient: { kind: 'communicationUser', communicationUserId: 'test' },
      senderDisplayName: '',
      id: '44',
      createdOn: new Date('01-01-2020'),
      editedOn: new Date('02-01-2020'),
      version: '1',
      metadata,
      streamingMetadata
    };
  };
});

const expectedResult = (
  metadata: Record<string, string>,
  streamingMetadata: StreamingMessageMetadata,
  tags?: string,
  content?: string
): IDirectLineActivity => {
  return {
    channelId: 'ACS_CHANNEL',
    channelData: {
      tags: tags,
      metadata: metadata,
      'webchat:sequence-id': 44,
      streamType: streamingMetadata.streamingMessageType ?? '',
      streamId: '44',
      streamSequence: streamingMetadata.streamingSequenceNumber ?? -1
    },
    conversation: { id: mockThreadId },
    from: { id: 'test', name: undefined, role: Role.Bot },
    id: '44',
    text: content,
    timestamp: new Date('02-01-2020').toISOString(),
    type: ActivityType.Typing,
    messageid: '44',
    entities: [
      {
        type: DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
        streamType: streamingMetadata.streamingMessageType ?? '',
        streamId: '44',
        streamSequence: streamingMetadata.streamingSequenceNumber ?? -1
      }
    ]
  };
};
