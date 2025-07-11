import { OneDriveFileManager } from '../../src/filemanager/OneDriveFileManager';

const mockUrlFn = (): string => 'url';

const mockDriveItem = {
  id: 'id',
  name: 'test.pdf',
  file: {
    mimeType: 'application/pdf'
  },
  lastModifiedDateTime: Date.now()
};

const mockBlob = new Blob(['testing'], { type: 'application/pdf' });

globalThis.fetch = jest.fn().mockResolvedValue({
  status: 200,
  ok: true,
  json: () => Promise.resolve(mockDriveItem),
  blob: () => Promise.resolve(mockBlob)
} as Response);

describe('OneDriveFileManager tests', () => {
  afterAll(() => {
    (<jest.Mock>globalThis.fetch).mockClear();
    delete globalThis.fetch;
  });

  test('should return IFileMetaData after uploading file', async (): Promise<void> => {
    const fileManager = new OneDriveFileManager('token', mockUrlFn, mockUrlFn);
    const result = await fileManager.uploadFiles([
      {
        name: 'name',
        contentType: 'type',
        contentUrl: 'url'
      }
    ]);

    const uploadedFile = {
      fileId: mockDriveItem.id,
      metadata: {
        filename: 'name'
      }
    };
    const expectedResult = [uploadedFile];

    expect(result).toEqual(expectedResult);
  });

  test('should return File object after downloading file', async (): Promise<void> => {
    const fileManager = new OneDriveFileManager('token', mockUrlFn, mockUrlFn);
    const result = await fileManager.downloadFiles([
      {
        fileId: 'id',
        metadata: {
          myMetadata: 'test'
        }
      }
    ]);

    const file = new File([mockBlob], mockDriveItem.name, {
      type: mockDriveItem.file?.mimeType,
      lastModified: mockDriveItem.lastModifiedDateTime
    });
    const expectedFiles = [file];

    expect(result).toEqual(expectedFiles);
  });

  test('should return file ids if a ChatMessage contains them', () => {
    const fileManager = new OneDriveFileManager('token', mockUrlFn, mockUrlFn);
    const fileIds = ['id1', 'id2'];
    const metadata = {
      onedriveReferences: JSON.stringify(fileIds)
    };

    const result = fileManager.getFileIds(metadata);

    expect(result).toEqual(fileIds);
  });

  test('should return onedriveReferences property', () => {
    const fileManager = new OneDriveFileManager('token', mockUrlFn, mockUrlFn);
    const fileIds = ['id1', 'id2'];
    const property = {
      onedriveReferences: JSON.stringify(fileIds)
    };

    const result = fileManager.createFileIdProperty(fileIds);

    expect(result).toEqual(property);
  });

  test('should return file metadata if a ChatMessage contains them', () => {
    const fileManager = new OneDriveFileManager('token', mockUrlFn, mockUrlFn);
    const fileMetadata = [{ name: 'file1' }, { name: 'file2' }];
    const metadata = {
      onedriveMetadata: JSON.stringify(fileMetadata)
    };

    const result = fileManager.getFileMetadata(metadata);

    expect(result).toEqual(fileMetadata);
  });

  test('should return onedriveMetadata property', () => {
    const fileManager = new OneDriveFileManager('token', mockUrlFn, mockUrlFn);

    const fileMetadata = [{ name: 'file1' }, { name: 'file2' }];

    const property = {
      onedriveMetadata: JSON.stringify(fileMetadata)
    };

    const result = fileManager.createFileMetadataProperty(fileMetadata);

    expect(result).toEqual(property);
  });
});
