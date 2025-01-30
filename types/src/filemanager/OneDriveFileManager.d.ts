import { BotAttachment } from '../models/BotAttachment';
import { FileMetadata, IFileManager, IFileUploadRequest, IUploadedFile } from '../types/FileManagerTypes';
export declare class OneDriveFileManager implements IFileManager {
    private accessToken;
    private downloadUrl;
    private uploadUrl;
    constructor(token: string, downloadUrl: (fileId: string) => string, uploadUrl: (filename: string) => string);
    /**
     * Download blob contents from url.
     * @param contentUrl Url from createObjectURL().
     * @throws {Error}
     */
    private downloadBlob;
    /**
     * Fetches a DriveItem from OneDrive.
     * @param itemId The unique DriveItem id.
     * @throws {Error}
     */
    private downloadDriveItem;
    /**
     * Downloads files contents.
     * @param graphDownloadUrl The pre-authenticated DriveItem download url.
     * @throws {Error}
     */
    private downloadDriveItemContents;
    /**
     * Upload files to OneDrive.
     * @param files Contains information for uploading files.
     * @throws {Error}
     */
    uploadFiles(files: IFileUploadRequest[]): Promise<IUploadedFile[]>;
    /**
     * Download files from OneDrive.
     * @param files IUploadFiles containing the file id and additional metadata for download.
     * @throws {Error}
     */
    downloadFiles(files: IUploadedFile[]): Promise<File[]>;
    updatePermissions(): Promise<void>;
    /**
     * Get the file ids from a ChatMessage.
     * @param metadata The ChatMessage or event metadata property.
     */
    getFileIds(metadata?: Record<string, string>): string[];
    /**
     * Return the metadata containing the file ids to decorate a send message request with.
     * @param fileIds
     */
    createFileIdProperty(fileIds: string[]): Record<string, string>;
    /**
     * Get the file metadata from a ChatMessage.
     * @param metadata The ChatMessage or event metadata property.
     */
    getFileMetadata(metadata?: Record<string, string>): FileMetadata[];
    /**
     * Return the property containing the file metadata to decorate a send message request with.
     * @param fileIds
     */
    createFileMetadataProperty(metadata: FileMetadata[]): Record<string, string>;
    /**
     * Return a bot activity attachment object.
     * @param metadata should contain fileIds and fileMetadata pairs
     */
    createBotAttachment(metadata?: Record<string, string>): BotAttachment;
}
//# sourceMappingURL=OneDriveFileManager.d.ts.map