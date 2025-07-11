import {
  ActivityType,
  DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
  IDirectLineActivity,
  Role,
  TwoWaySerializableComplex
} from '../../../src/types/DirectLineTypes';
import { StreamingMessageMetadata } from '@azure/communication-chat';
import { ChatEventMessage, convertMessageToActivity } from '../../../src/utils/ConvertMessageUtils';
import { getDataURL } from '../../../src/ingress/ingressHelpers';
import { BOT_ADAPTIVE_CARD_METADATA_KEY, BOT_ADAPTIVE_CARD_METADATA_VALUE } from '../../../src/types/BotFrameworkTypes';
import { CommunicationUserKind } from '@azure/communication-common';
import EventManager from '../../../src/utils/EventManager';
import { ACSDirectLineActivity } from '../../../src';

jest.mock('../../../src/utils/ClientIdToMessageId', () => {
  return {
    getClientId: (messageId: string) => messageId
  };
});

const next = jest.fn();
const mockMetadata = {
  key: 'value'
};

const mockMetaDataWithTags = {
  key: 'value',
  tags: '["tag1", "tag2"]'
};

const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
const mockThreadId = 'mockThreadId';

// Mock the EventManager class
jest.mock('../../../src/utils/EventManager', () => {
  return jest.fn().mockImplementation(() => ({
    handleError: jest.fn()
  }));
});

const eventManager = new EventManager();

describe('convertMessageToActivity tests', () => {
  beforeEach(() => {
    next.mockClear();
  });

  test('should return activity with valid tags', async (): Promise<void> => {
    const content = 'test message';
    const message = GenerateMessage(content, mockMetaDataWithTags);
    const expectedResult: IDirectLineActivity = ExpectedResult(
      undefined,
      content,
      undefined,
      mockMetaDataWithTags,
      undefined,
      mockMetaDataWithTags.tags
    );
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity with text message', async (): Promise<void> => {
    const content = 'test message';
    const message = GenerateMessage(content, mockMetadata);
    const expectedResult: IDirectLineActivity = ExpectedResult(undefined, content, undefined, mockMetadata);
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity with finished message streaming', async (): Promise<void> => {
    const content = 'test message';
    const streamingMetadata: StreamingMessageMetadata = {
      streamingMessageType: 'final'
    };
    const message = GenerateMessage(content, mockMetadata, streamingMetadata);

    const expectedResult: IDirectLineActivity = ExpectedResult(undefined, content, undefined, mockMetadata);
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
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity with adaptive card', async (): Promise<void> => {
    const adaptiveCard = {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        actions: [
          {
            type: 'Action.Submit',
            title: 'Snooze',
            data: {
              x: 'snooze'
            }
          }
        ],
        body: [
          {
            text: 'Hello',
            type: 'TextBlock'
          }
        ],
        type: 'AdaptiveCard',
        version: '1.1'
      }
    };
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const attachments = {
      attachments: [adaptiveCard]
    };
    const message = GenerateMessage(JSON.stringify(attachments), metadata);
    const expectedResult: IDirectLineActivity = ExpectedResult([adaptiveCard], undefined, undefined, metadata);
    const result = await convertMessageToActivity(eventManager, message, true, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity without adaptive card when enableAdaptiveCards is false', async (): Promise<void> => {
    const adaptiveCard = {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        actions: [
          {
            type: 'Action.Submit',
            title: 'Snooze',
            data: {
              x: 'snooze'
            }
          }
        ],
        body: [
          {
            text: 'Hello',
            type: 'TextBlock'
          }
        ],
        type: 'AdaptiveCard',
        version: '1.1'
      }
    };
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const attachments = {
      attachments: [adaptiveCard]
    };
    const message = GenerateMessage(JSON.stringify(attachments), metadata);
    const expectedResult: IDirectLineActivity = ExpectedResult(undefined, undefined, undefined, metadata);
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity with adaptive card response', async (): Promise<void> => {
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const value = {
      actionSubmitId: 'Submit',
      name: '22',
      email: '22',
      phone: '22'
    };
    const content = {
      value: value
    };
    const message = GenerateMessage(JSON.stringify(content), metadata);
    const expectedResult: IDirectLineActivity = ExpectedResult(undefined, undefined, value, metadata);
    const result = await convertMessageToActivity(eventManager, message, false, true, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity without adaptive card response when enableAdaptiveCardsResponses is false', async (): Promise<void> => {
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const value = {
      actionSubmitId: 'Submit',
      name: '22',
      email: '22',
      phone: '22'
    };
    const content = {
      value: value
    };
    const message = GenerateMessage(JSON.stringify(content), metadata);
    const expectedResult: IDirectLineActivity = ExpectedResult(undefined, undefined, undefined, metadata);
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity with carousel of cards', async (): Promise<void> => {
    const adaptiveCard = {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        actions: [
          {
            type: 'Action.Submit',
            title: 'Snooze',
            data: {
              x: 'snooze'
            }
          }
        ],
        body: [
          {
            text: 'Hello',
            type: 'TextBlock'
          }
        ],
        type: 'AdaptiveCard',
        version: '1.1'
      }
    };
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const attachments = {
      attachments: [adaptiveCard, adaptiveCard],
      attachmentLayout: 'carousel'
    };
    const message = GenerateMessage(JSON.stringify(attachments), metadata);
    const expectedResult: IDirectLineActivity = ExpectedResult(
      [adaptiveCard, adaptiveCard],
      undefined,
      undefined,
      metadata,
      undefined,
      undefined,
      'carousel'
    );
    const result = await convertMessageToActivity(eventManager, message, true, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return empty text message if parsing cards failed', async (): Promise<void> => {
    const content = 'test message';
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const message = GenerateMessage(content, metadata);
    const expectedResult: IDirectLineActivity = ExpectedResult(undefined, undefined, undefined, metadata);
    const result = await convertMessageToActivity(eventManager, message, true, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should return activity with attachments', async (): Promise<void> => {
    const message = GenerateMessage('hello', mockMetadata);
    message.files = [mockFile];
    const attachments = [
      {
        contentType: mockFile.type,
        contentUrl: await getDataURL(mockFile),
        name: mockFile.name
      }
    ];
    const attachmentSizes = [mockFile.size];
    const expectedResult = ExpectedResult(attachments, 'hello', undefined, mockMetadata, attachmentSizes);
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result).toEqual(expectedResult);
  });

  test('should call eventManager.handleError when parsing fails and enableMessageErrorHandler is true', async (): Promise<void> => {
    const content = 'invalid json';
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const message = GenerateMessage(content, metadata);
    await convertMessageToActivity(eventManager, message, true, false, true);
    expect(eventManager.handleError).toHaveBeenCalled();
  });

  test('should include editedOn in additionalMessageMetadata when provided', async (): Promise<void> => {
    const content = 'test message';
    const message = GenerateMessage(content, mockMetadata);
    const editedOn = new Date('02-01-2020');
    message.editedOn = editedOn;

    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect((result.channelData?.additionalMessageMetadata as TwoWaySerializableComplex)?.deletedOn).toEqual(
      message.deletedOn?.toISOString()
    );
  });

  test('should include deletedOn in additionalMessageMetadata when provided', async (): Promise<void> => {
    const content = 'test message';
    const message = GenerateMessage(content, mockMetadata);
    const deletedOn = new Date('02-01-2020');
    message.deletedOn = deletedOn;

    const result = await convertMessageToActivity(eventManager, message, false, false, false);

    expect((result.channelData?.additionalMessageMetadata as TwoWaySerializableComplex)?.editedOn).toEqual(
      message.editedOn?.toISOString()
    );
  });

  test('should generate unique ID when messageId is not provided', async (): Promise<void> => {
    const content = 'test message';
    const message = GenerateMessage(content, mockMetadata);
    message.messageId = '';

    const result = await convertMessageToActivity(eventManager, message, false, false, false);

    expect(result.id).toBeTruthy();
    expect(result.id).not.toEqual('');
  });

  test('should include suggestedActions when provided in adaptive card content', async (): Promise<void> => {
    const suggestedActions = {
      actions: [
        {
          title: 'Option 1',
          type: 'imBack',
          value: 'option 1'
        }
      ]
    };
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const content = {
      suggestedActions: suggestedActions
    };
    const message = GenerateMessage(JSON.stringify(content), metadata);
    const result = await convertMessageToActivity(eventManager, message, true, false, false);
    expect(result.suggestedActions).toEqual(suggestedActions);
  });

  test('should include text from adaptive card content when provided', async (): Promise<void> => {
    const cardText = 'Text from adaptive card';
    const metadata = {
      [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
    };
    const content = {
      text: cardText
    };
    const message = GenerateMessage(JSON.stringify(content), metadata);
    const result = await convertMessageToActivity(eventManager, message, true, false, false);
    expect(result.text).toEqual(cardText);
  });

  test('should set sequenceIdAsANumber to undefined when sequenceId is not a positive number', async (): Promise<void> => {
    const content = 'test message';
    const message = GenerateMessage(content, mockMetadata);
    message.sequenceId = '-1';
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result.channelData?.['webchat:sequence-id']).toBeUndefined();
  });

  test('should handle messages without metadata', async (): Promise<void> => {
    const content = 'test message';
    const message = GenerateMessage(content);
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result.text).toEqual(content);
  });

  test('should use clientActivityId from metadata when getClientId returns undefined', async (): Promise<void> => {
    // Setup a temporary mock that returns undefined for this specific test
    const originalGetClientId = jest.requireMock('../../../src/utils/ClientIdToMessageId').getClientId;
    jest.requireMock('../../../src/utils/ClientIdToMessageId').getClientId = jest.fn().mockReturnValueOnce(undefined);
    const clientActivityId = 'client-activity-123';
    const message = GenerateMessage('test', { clientActivityId });
    const result = await convertMessageToActivity(eventManager, message, false, false, false);
    expect(result.channelData?.clientActivityID).toEqual(clientActivityId);

    // Restore the original mock
    jest.requireMock('../../../src/utils/ClientIdToMessageId').getClientId = originalGetClientId;
  });
});

function GenerateMessage(
  content: string,
  metadata?: Record<string, string>,
  streamingMetadata?: StreamingMessageMetadata
): ChatEventMessage {
  return {
    content: content,
    threadId: mockThreadId,
    sender: { kind: 'communicationUser', communicationUserId: 'userId' } as CommunicationUserKind,
    currentUserId: 'anotherUserId',
    senderDisplayName: '',
    messageId: '44',
    createdOn: new Date('01-01-2020'),
    metadata: metadata,
    streamingMetadata,
    sequenceId: '44'
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
): ACSDirectLineActivity {
  return {
    attachments,
    channelId: 'ACS_CHANNEL',
    channelData: {
      fromUserId: 'userId',
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
    from: { id: 'userId', name: undefined, role: Role.Bot },
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
