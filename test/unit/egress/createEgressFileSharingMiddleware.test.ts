import createEgressFileAttachmentMiddleware from '../../../src/egress/createEgressFileAttachmentMiddleware';
import { StateKey } from '../../../src/models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../../src/models/ACSDirectLineActivity';
import { Role, ActivityType } from '../../../src/types/DirectLineTypes';
import { MockMiddlewareTemplate } from '../mocks/AdapterMock';

const adapterMock = MockMiddlewareTemplate();
const next = jest.fn();

const mockUploadFiles = jest.fn().mockResolvedValue([
  {
    fileId: 'ID'
  }
]);

const MockFileManager = (): any => {
  return {
    uploadFiles: mockUploadFiles
  };
};

const MockEventManager = (): any => {
  return {
    handleError: jest.fn()
  };
};

const activity: ACSDirectLineActivity = {
  attachments: [
    {
      contentType: 'image/png',
      contentUrl: 'mockUrl1',
      thumbnailUrl: 'mockThumbnail',
      name: 'test.png'
    },
    {
      contentType: 'application/pdf',
      contentUrl: 'mockUrl2',
      name: 'test.pdf'
    }
  ],
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
  if (stateKey === StateKey.FileManager) {
    return MockFileManager();
  }
};

describe('createEgressFileSharingMiddleware tests', () => {
  beforeEach(() => {
    next.mockClear();
  });

  test('should call FileManager uploadFiles if activity contains attachments', async (): Promise<void> => {
    const egressFunction = createEgressFileAttachmentMiddleware()(adapterMock)(next);
    expect(egressFunction).toBeDefined();
    if (!egressFunction) {
      return;
    }

    await egressFunction(activity);
    expect(mockUploadFiles).toHaveBeenCalledTimes(1)
    expect(mockUploadFiles.mock.calls[0][0]).toBe(activity.attachments);
  });

  test('should add uploadFileMetadata to the activity if attachments are uploaded', async (): Promise<void> => {
    const egressFunction = createEgressFileAttachmentMiddleware()(adapterMock)(next);
    expect(egressFunction).toBeDefined();
    if (!egressFunction) {
      return;
    }

    const updatedActivity = activity;
    updatedActivity.channelData = {
      ...activity.channelData,
      uploadedFiles: [{ fileId: 'ID' }, { fileId: 'ID' }]
    };

    await egressFunction(activity);
    expect(next.mock.calls[0]).toEqual([updatedActivity]);
  });

  test('should not add uploadFileMetadata to the activity if attachments are not uploaded', async (): Promise<void> => {
    adapterMock.getState = (stateKey: StateKey) => {
      if (stateKey === StateKey.FileManager) {
        return {
          uploadFiles: jest.fn().mockImplementation(() => {
            throw new Error();
          })
        };
      }
      if (stateKey === StateKey.EventManager) {
        return MockEventManager();
      }
    };

    const egressFunction = createEgressFileAttachmentMiddleware()(adapterMock)(next);
    expect(egressFunction).toBeDefined();
    if (!egressFunction) {
      return;
    }

    await egressFunction(activity);
    expect(next.mock.calls[0]).toEqual([activity]);
  });
});
