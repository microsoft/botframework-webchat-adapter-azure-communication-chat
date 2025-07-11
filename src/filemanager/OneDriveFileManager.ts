import { BotAttachment } from '../models/BotAttachment';
import { FileMetadata, IFileManager, IFileUploadRequest, IUploadedFile } from '../types/FileManagerTypes';

export class OneDriveFileManager implements IFileManager {
  private accessToken: string;
  private downloadUrl: (fileId: string) => string;
  private uploadUrl: (fileId: string) => string;

  public constructor(token: string, downloadUrl: (fileId: string) => string, uploadUrl: (filename: string) => string) {
    this.accessToken = token;
    // TODO: Could just choose one format
    this.downloadUrl = downloadUrl;
    this.uploadUrl = uploadUrl;
  }

  /**
   * Download blob contents from url.
   * @param contentUrl Url from createObjectURL().
   * @throws {Error}
   */
  private async downloadBlob(contentUrl: string): Promise<Blob> {
    const contents = await fetch(contentUrl);

    if (!contents.ok) {
      throw new Error('Failed to fetch file contents.');
    }

    return await contents.blob();
  }

  /**
   * Fetches a DriveItem from OneDrive.
   * @param itemId The unique DriveItem id.
   * @throws {Error}
   */
  private async downloadDriveItem(itemId: string): Promise<any> {
    const url: string = this.downloadUrl(itemId);
    const request: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + this.accessToken,
        'Content-Type': 'application/json'
      }
    };

    const response: Response = await fetch(url, request);
    const result: any = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to download drive item from OneDrive: ${result.error?.message}`);
    }

    return result;
  }

  /**
   * Downloads files contents.
   * @param graphDownloadUrl The pre-authenticated DriveItem download url.
   * @throws {Error}
   */
  private async downloadDriveItemContents(graphDownloadUrl: string): Promise<Blob> {
    const response: Response = await fetch(graphDownloadUrl);

    if (!response.ok) {
      const result = await response.json();
      throw new Error(`Failed to download drive item contents from OneDrive: ${result.error?.message}`);
    }

    return await response.blob();
  }

  /**
   * Upload files to OneDrive.
   * @param files Contains information for uploading files.
   * @throws {Error}
   */
  public async uploadFiles(files: IFileUploadRequest[]): Promise<IUploadedFile[]> {
    return Promise.all(
      files.map(async (file) => {
        // Get the blob data
        const blob: Blob = await this.downloadBlob(file.contentUrl);

        const url: string = this.uploadUrl(file.name);
        const request: RequestInit = {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + this.accessToken,
            'Content-Type': file.contentType
          },
          body: blob
        };

        // Upload to OneDrive
        const response: Response = await fetch(url, request);
        const result: any = await response.json();

        if (result.error) {
          throw new Error(`Failed to upload file to OneDrive. ${result.error.message}`);
        }

        // The response is a DriveItem
        // Return IUploadedFile containing the file id and the name as an example of metadata
        return {
          fileId: result.id,
          metadata: {
            filename: file.name
          }
        };
      })
    );
  }

  /**
   * Download files from OneDrive.
   * @param files IUploadFiles containing the file id and additional metadata for download.
   * @throws {Error}
   */
  public async downloadFiles(files: IUploadedFile[]): Promise<File[]> {
    return Promise.all(
      files.map(async (file) => {
        // Get the DriveItem which contains the file metadata
        const driveItem = await this.downloadDriveItem(file.fileId);

        // Download the contents using pre-authenticated download url
        const graphDownloadUrl = driveItem['@microsoft.graph.downloadUrl'];
        const blob = await this.downloadDriveItemContents(graphDownloadUrl);

        // Example using the metadata
        // IUploadFile will contain any custom metadata you provided during upload
        if (file.metadata?.name) {
          console.log(`File name: ${file.metadata?.name}`);
        }

        // Create the file
        return new File([blob], driveItem.name, {
          type: driveItem.file?.mimeType,
          lastModified: driveItem.lastModifiedDateTime
        });
      })
    );
  }

  public async updatePermissions(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get the file ids from a ChatMessage.
   * @param metadata The ChatMessage or event metadata property.
   */
  public getFileIds(metadata?: Record<string, string>): string[] {
    if (metadata?.onedriveReferences) {
      try {
        return JSON.parse(metadata?.onedriveReferences);
      } catch (e) {
        throw new Error('Failed to parse onedriveReferences in ChatMessage metadata: ', e);
      }
    }
  }

  /**
   * Return the metadata containing the file ids to decorate a send message request with.
   * @param fileIds
   */
  public createFileIdProperty(fileIds: string[]): Record<string, string> {
    // This means property name onedriveReferences is reserved for this use case in the ChatMessage metadata
    // The adapter does not validate if you overwrite the property with some other data
    return {
      onedriveReferences: JSON.stringify(fileIds)
    };
  }

  /**
   * Get the file metadata from a ChatMessage.
   * @param metadata The ChatMessage or event metadata property.
   */
  public getFileMetadata(metadata?: Record<string, string>): FileMetadata[] {
    if (metadata?.onedriveMetadata) {
      try {
        return JSON.parse(metadata?.onedriveMetadata);
      } catch (e) {
        throw new Error('Failed to parse onedriveMetadata in ChatMessage metadata.', e);
      }
    }
  }

  /**
   * Return the property containing the file metadata to decorate a send message request with.
   * @param fileIds
   */
  public createFileMetadataProperty(metadata: FileMetadata[]): Record<string, string> {
    // This means property name onedriveMetadata is reserved for this use case in the ChatMessage metadata
    // The adapter does not validate if you overwrite the property with some other data
    return {
      onedriveMetadata: JSON.stringify(metadata)
    };
  }

  /**
   * Return a bot activity attachment object.
   * @param metadata should contain fileIds and fileMetadata pairs
   */
  public createBotAttachment(metadata?: Record<string, string>): BotAttachment {
    if (!metadata || Object.keys(metadata).length === 0) {
      return null;
    }

    const fileMetadataList = this.getFileMetadata(metadata);
    const fileIds = this.getFileIds(metadata);

    let fileId;
    let fileMetadata;

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
}
