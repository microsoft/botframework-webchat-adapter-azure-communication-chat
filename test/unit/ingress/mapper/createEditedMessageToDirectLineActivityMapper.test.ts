import { ChatMessage, ChatMessageEditedEvent } from '@azure/communication-chat';
import { getAttachments } from '../../../../src/ingress/ingressHelpers';
import createEditedMessageToDirectLineActivityMapper from '../../../../src/ingress/mappers/createEditedMessageToDirectLineActivityMapper';
import { IDirectLineActivity, TwoWaySerializableComplex } from '../../../../src/types/DirectLineTypes';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import { MockMiddlewareTemplate } from '../../mocks/AdapterMock';

const adapterMock = MockMiddlewareTemplate();
const next = jest.fn();
const mockStateUserId = 'mockId';
const mockFileIds = ['id1', 'id2'];
const mockTags = JSON.stringify(['tag1', 'tag2']);
const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
const mockSenderId = 'senderId';
const mockMetadata = {
  key: 'value'
};

const mockChatMessage: ChatMessage = {
  id: '123',
  type: 'text',
  sequenceId: '1',
  version: '1',
  createdOn: new Date(),
  content: {
    message: 'Hello'
  },
  metadata: {
    fileIds: JSON.stringify(mockFileIds),
    tags: mockTags
  },
  sender: {
    communicationUserId: mockSenderId,
    kind: 'communicationUser'
  },
  senderDisplayName: 'senderName'
};

describe('createTypingMessageToDirectLineActivityMapper tests', () => {
  beforeAll(() => {
    globalThis.URL.createObjectURL = jest.fn(() => {
      return 'mockUrl';
    });
  });

  beforeEach(() => {
    next.mockClear();
  });

  test('should be able to return an activity from a ChatMessageEditedEvent for a message that does not contain metadata', async (): Promise<void> => {
    // Mock out FileManager
    adapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.ChatClient) {
        return {};
      }
      if (stateKey === StateKey.UserId) {
        return mockStateUserId;
      }
      if (stateKey === StateKey.FileManager) {
        return {
          getFileIds: jest.fn(() => {
            return undefined;
          }),
          getFileMetadata: jest.fn(() => {
            return undefined;
          })
        };
      }
    };

    const senderId = 'senderUserId';
    const event: ChatMessageEditedEvent = {
      message: 'some edited message',
      editedOn: new Date(),
      id: '25',
      createdOn: new Date(),
      version: 'version',
      type: 'text',
      threadId: 'threadId',
      sender: {
        communicationUserId: senderId,
        kind: 'communicationUser'
      },
      senderDisplayName: 'senderName',
      recipient: {
        communicationUserId: 'recipientUserId',
        kind: 'communicationUser'
      },
      metadata: {}
    };
    const result = (await createEditedMessageToDirectLineActivityMapper(adapterMock)(next)(
      event
    )) as IDirectLineActivity;
    expect(result.messageid).toEqual(event.id);
    expect(result.text).toEqual(event.message);
    expect(result.timestamp).toEqual(event.editedOn.toISOString());
    expect(result.from.id).toEqual(senderId);
    expect(result.from.name).toEqual(event.senderDisplayName);
    expect(result.attachments).toBeUndefined();
    expect(result.channelData).toBeDefined();
    if (result.channelData) {
      expect(result.channelData['webchat:sequence-id']).toBe(25);
    }
  });

  test('should be able to return an activity from a ChatMessageEditedEvent that contains metadata', async (): Promise<void> => {
    // Mock out FileManager
    adapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.ChatClient) {
        return {};
      }
      if (stateKey === StateKey.UserId) {
        return mockStateUserId;
      }
      if (stateKey === StateKey.FileManager) {
        return {
          getFileIds: jest.fn(() => {
            return [mockFileIds];
          }),
          getFileMetadata: jest.fn(() => {
            return [mockMetadata, mockMetadata];
          }),
          downloadFiles: jest.fn(() => {
            return [mockFile, mockFile];
          })
        };
      }
    };

    const event: ChatMessageEditedEvent = {
      message: mockChatMessage.content.message,
      editedOn: new Date(),
      id: mockChatMessage.id,
      createdOn: mockChatMessage.createdOn,
      version: mockChatMessage.version,
      type: mockChatMessage.type,
      threadId: 'threadId',
      sender: mockChatMessage.sender,
      senderDisplayName: mockChatMessage.senderDisplayName,
      recipient: {
        communicationUserId: 'recipientUserId',
        kind: 'communicationUser'
      },
      metadata: {
        fileIds: JSON.stringify(mockFileIds),
        tags: mockTags
      }
    };
    const expectedAttachments = await getAttachments([mockFile, mockFile]);
    const expectedAttachmentSizes = [mockFile.size, mockFile.size];

    const result = (await createEditedMessageToDirectLineActivityMapper(adapterMock)(next)(
      event
    )) as IDirectLineActivity;

    expect(result.messageid).toEqual(event.id);
    expect(result.text).toEqual(event.message);
    expect(result.timestamp).toEqual(event.createdOn.toISOString());
    expect((result.channelData?.additionalMessageMetadata as TwoWaySerializableComplex)?.editedOn).toEqual(
      event.editedOn.toISOString()
    );
    expect((result.channelData?.additionalMessageMetadata as TwoWaySerializableComplex)?.deletedOn).toBeUndefined();
    expect(result.from.id).toEqual(mockSenderId);
    expect(result.from.name).toEqual(event.senderDisplayName);
    expect(result.channelData?.tags).toEqual(mockTags);
    expect(result.attachments).toEqual(expectedAttachments);
    expect(result.channelData?.attachmentSizes).toEqual(expectedAttachmentSizes);
    expect(result.channelData?.metadata).toEqual(event.metadata);
  });
});
