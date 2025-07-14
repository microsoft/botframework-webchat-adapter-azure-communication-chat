import { ActivityType, Role } from '../../../src/types/DirectLineTypes';

import { ACSDirectLineActivity } from '../../../src/models/ACSDirectLineActivity';
import { FileMetadata } from '../../../src/types/FileManagerTypes';
import { MockMiddlewareTemplate } from '../mocks/AdapterMock';
import { StateKey } from '../../../src/models/ACSAdapterState';
import { StatusCodes } from 'http-status-codes';
import createEgressMessageActivityMiddleware from '../../../src/egress/createEgressMessageActivityMiddleware';
import { BotAttachment } from '../../../src/models/BotAttachment';
import { BOT_ADAPTIVE_CARD_METADATA_KEY, BOT_ADAPTIVE_CARD_METADATA_VALUE } from '../../../src/types/BotFrameworkTypes';

const mockSetMessageIdToClientId = jest.fn();

jest.mock('../../../src/utils/ClientIdToMessageId', () => {
  return {
    setMessageIdToClientId: (messageId: string, clientId: string) => mockSetMessageIdToClientId(messageId, clientId)
  };
});

const adapterMock = MockMiddlewareTemplate();
const adapterMockAdaptivsCard = MockMiddlewareTemplate();
const next = jest.fn();

const mockSendMessage = jest
  .fn()
  .mockResolvedValue({ id: 'message result id', _response: { status: StatusCodes.CREATED } });

const mockSendMessageError = jest.fn().mockRejectedValue(new Error('Network Error'));

const MockChatThreadClient = (): any => {
  return {
    sendMessage: mockSendMessage
  };
};

const MockChatThreadClientWithError = (): any => {
  return {
    sendMessage: mockSendMessageError
  };
};

const MockEventManager = (): any => {
  return {
    handleError: jest.fn()
  };
};

const MockFileManager = (): any => {
  return {
    createFileIdProperty: (fileIds: string[]) => {
      return {
        onedriveReferences: JSON.stringify(fileIds)
      };
    },
    createFileMetadataProperty: (metadata: FileMetadata[]) => {
      return {
        onedriveMetadata: JSON.stringify(metadata)
      };
    },
    createBotAttachment: (metadata?: Record<string, string>) => {
      if (!metadata || Object.keys(metadata).length === 0) {
        return null;
      }
      const fileMetadataList = JSON.parse(metadata?.onedriveMetadata);
      const fileIds = JSON.parse(metadata?.onedriveReferences);

      let fileId: string | undefined = undefined;
      let fileMetadata: FileMetadata | undefined = undefined;

      if (fileIds && fileIds.length > 0) {
        fileId = fileIds[0];
      }

      if (fileMetadataList && fileMetadataList.length > 0) {
        fileMetadata = fileMetadataList[0];
      }

      if (fileId) {
        const attachment: BotAttachment = {
          contentType: fileMetadata?.contentType,
          name: fileMetadata?.fileName,
          content: { uniqueId: fileId }
        };
        return attachment;
      }
      return null;
    }
  };
};

const activity: ACSDirectLineActivity = {
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

adapterMockAdaptivsCard.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatThreadClient) {
    return MockChatThreadClient();
  }
  if (stateKey === StateKey.UserDisplayName) {
    return 'user';
  }
  if (stateKey === StateKey.AdapterOptions) {
    return {
      enableAdaptiveCards: true
    };
  }
};

adapterMock.getState = (stateKey: StateKey) => {
  if (stateKey === StateKey.ChatThreadClient) {
    return MockChatThreadClient();
  }
  if (stateKey === StateKey.UserDisplayName) {
    return 'user';
  }
  if (stateKey === StateKey.EventManager) {
    return MockEventManager();
  }
  if (stateKey === StateKey.FileManager) {
    return MockFileManager();
  }
};

describe('createEgressMessageActivityMiddleware tests', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
    mockSetMessageIdToClientId.mockClear();
    next.mockClear();
  });

  test('should be able to call sendMessage with the right parameter', async (): Promise<void> => {
    const expectSendMessageRequest = {
      content: activity.text
    };
    const expectSendMessageOptions = {
      senderDisplayName: 'user'
    };
    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    expect(egressFunction).toBeDefined();
    if (!egressFunction) {
      return;
    }
    await egressFunction(activity);
    expect(mockSendMessage.mock.calls[0]).toMatchObject([expectSendMessageRequest, expectSendMessageOptions]);
  });

  test('should be able to set clientActivity to the map', async (): Promise<void> => {
    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }
    await egressFunction(activity);
    expect(mockSetMessageIdToClientId).toHaveBeenCalledTimes(1);
    expect(mockSetMessageIdToClientId.mock.calls[0]).toEqual([
      'message result id',
      activity.channelData.clientActivityID
    ]);
  });

  test('should skip the activity when it is not Message type', async (): Promise<void> => {
    const otherActivity = { ...activity, type: ActivityType.Typing };
    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }
    await egressFunction(otherActivity);
    expect(mockSendMessage).toHaveBeenCalledTimes(0);
    expect(next.mock.calls[0]).toEqual([otherActivity]);
  });

  test('should add file ids to send message request if message contains attachments', async (): Promise<void> => {
    const attachmentActivity = {
      ...activity
    };

    attachmentActivity.channelData = {
      ...attachmentActivity.channelData,
      uploadedFiles: [{ fileId: 'id1' }, { fileId: 'id2' }]
    };

    const sendMessageRequest = {
      content: `{"attachments":[{"content":{"uniqueId":"id1"}}],"text":"${attachmentActivity.text}"}`
    };

    const sendMessageOptions = {
      senderDisplayName: 'user',
      metadata: {
        onedriveReferences: JSON.stringify(['id1', 'id2'])
      }
    };

    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }

    await egressFunction(attachmentActivity);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage.mock.calls[0]).toMatchObject([sendMessageRequest, sendMessageOptions]);
  });

  test('should send message without attachment if there are empty uploadedFiles', async (): Promise<void> => {
    const attachmentActivity = {
      ...activity
    };

    attachmentActivity.channelData = {
      ...attachmentActivity.channelData,
      uploadedFiles: []
    };

    const sendMessageRequest = {
      content: `${attachmentActivity.text}`
    };

    const sendMessageOptions = {
      senderDisplayName: 'user',
      metadata: {
        onedriveReferences: JSON.stringify([])
      }
    };

    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }

    await egressFunction(attachmentActivity);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage.mock.calls[0]).toMatchObject([sendMessageRequest, sendMessageOptions]);
  });

  test('should add attachmentLayout to send message request if the activity contains carousel of cards', async (): Promise<void> => {
    const carouselOfCardsActivity = {
      ...activity
    };

    carouselOfCardsActivity.attachmentLayout = 'carousel';

    const sendMessageRequest = {
      content: JSON.stringify({
        attachmentLayout: 'carousel',
        text: 'test message'
      })
    };

    const sendMessageOptions = {
      senderDisplayName: 'user',
      metadata: {
        [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
      }
    };

    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }

    await egressFunction(carouselOfCardsActivity);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage.mock.calls[0]).toMatchObject([sendMessageRequest, sendMessageOptions]);
  });

  test('should have value field if adaptive card response is sent', async (): Promise<void> => {
    const value = '{"actionSubmitId":"Submit","name":"22","email":"22","phone":"22"}';
    const testActivity: ACSDirectLineActivity = {
      ...activity,
      value: '{"actionSubmitId":"Submit","name":"22","email":"22","phone":"22"}',
      text: undefined
    };

    const sendMessageRequest = {
      content: JSON.stringify({
        value: value
      })
    };

    const sendMessageOptions = {
      senderDisplayName: 'user',
      metadata: {
        [BOT_ADAPTIVE_CARD_METADATA_KEY]: BOT_ADAPTIVE_CARD_METADATA_VALUE
      }
    };

    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }

    await egressFunction(testActivity);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage.mock.calls[0]).toMatchObject([sendMessageRequest, sendMessageOptions]);
  });

  test('should add tags to send message request if the activity contains tags', async (): Promise<void> => {
    const tagsActivity = {
      ...activity
    };

    tagsActivity.channelData.tags = JSON.stringify(['tag1', 'tag2']);

    const sendMessageRequest = {
      content: tagsActivity.text
    };

    const sendMessageOptions = {
      senderDisplayName: 'user',
      metadata: {
        tags: tagsActivity.channelData.tags
      }
    };

    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }

    await egressFunction(tagsActivity);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage.mock.calls[0]).toMatchObject([sendMessageRequest, sendMessageOptions]);
  });

  test('should add metadata to send message request if the activity contains metadata', async (): Promise<void> => {
    const metadataActivity = {
      ...activity
    };

    metadataActivity.channelData.metadata = {
      a: 'b',
      c: 'd'
    };

    const sendMessageRequest = {
      content: metadataActivity.text
    };

    const sendMessageOptions = {
      senderDisplayName: 'user',
      metadata: {
        ...metadataActivity.channelData.metadata
      }
    };

    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    if (!egressFunction) {
      return;
    }

    await egressFunction(metadataActivity);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage.mock.calls[0]).toMatchObject([sendMessageRequest, sendMessageOptions]);
  });

  test('should fail when Chat client call fails', async (): Promise<void> => {
    adapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.ChatThreadClient) {
        return MockChatThreadClientWithError();
      }
      if (stateKey === StateKey.UserDisplayName) {
        return 'user';
      }
      if (stateKey === StateKey.EventManager) {
        return MockEventManager();
      }
      if (stateKey === StateKey.FileManager) {
        return MockFileManager();
      }
    };

    const egressFunction = createEgressMessageActivityMiddleware()(adapterMock)(next);
    expect(egressFunction).toBeDefined();
    if (!egressFunction) {
      return;
    }

    try {
      await egressFunction(activity);
    } catch (e) {
      expect(e).toEqual('Network error');
    }
  });
});
