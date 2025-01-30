import { CommunicationIdentifier } from '@azure/communication-common';
import { FileMetadata, IFileManager, IUploadedFile } from '../types/FileManagerTypes';
import EventManager from '../utils/EventManager';
/**
 * Returns the users id.
 * @param identifier
 */
export declare const getIdFromIdentifier: (identifier: CommunicationIdentifier) => string;
/**
 * Gets a dataURL for the given File.
 * @param file
 */
export declare const getDataURL: (file: File) => Promise<string | ArrayBuffer>;
/**
 * Downloads files and returns the successfully downloaded files.
 * Errors are dispatched by EventManager.
 * @param fileIds
 * @param filemanager
 */
export declare const downloadAttachments: (fileIds: string[], metadata: FileMetadata[], filemanager: IFileManager, eventManager: EventManager) => Promise<File[]>;
/**
 * Downloads files and returns the successfully downloaded files.
 * Errors are dispatched by EventManager.
 * @param fileData
 * @param filemanager
 */
export declare const downloadAttachmentsDirect: (fileData: IUploadedFile[], filemanager: IFileManager, eventManager: EventManager, shouldTimeout: boolean, attachmentDownloadTimeout?: number) => Promise<File[]>;
export declare const getAttachments: (files: File[]) => Promise<any[]>;
export declare const getAttachmentSizes: (files: File[]) => number[];
//# sourceMappingURL=ingressHelpers.d.ts.map