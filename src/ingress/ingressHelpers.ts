import { CommunicationIdentifier, getIdentifierKind } from '@azure/communication-common';
import { Logger, LogLevel } from '../log/Logger';
import { FileMetadata, IFileManager, IUploadedFile } from '../types/FileManagerTypes';
import { LogEvent } from '../types/LogTypes';
import EventManager from '../utils/EventManager';

/**
 * Returns the users id.
 * @param identifier
 */
export const getIdFromIdentifier = (identifier: CommunicationIdentifier): string => {
  const id = getIdentifierKind(identifier);
  switch (id.kind) {
    case 'communicationUser':
      return id.communicationUserId;
    case 'microsoftTeamsUser':
      return id.microsoftTeamsUserId;
    case 'phoneNumber':
      return id.phoneNumber;
    case 'unknown':
      return id.id;
  }
};

/**
 * Gets a dataURL for the given File.
 * @param file
 */
export const getDataURL = (file: File): Promise<string | ArrayBuffer> => {
  return new Promise((resolve) => {
    const filereader = new FileReader();
    filereader.onloadend = () => {
      resolve(filereader.result);
    };
    filereader.readAsDataURL(file);
  });
};

/**
 * Downloads files and returns the successfully downloaded files.
 * Errors are dispatched by EventManager.
 * @param fileIds
 * @param filemanager
 */
export const downloadAttachments = async (
  fileIds: string[],
  metadata: FileMetadata[],
  filemanager: IFileManager,
  eventManager: EventManager
): Promise<File[]> => {
  try {
    // Construct the IUploadedFile objects for download
    // Metadata is optional
    let files: IUploadedFile[];
    if (metadata) {
      files = fileIds.map((id, i) => {
        return {
          fileId: id,
          metadata: metadata[i]
        };
      });
    } else {
      files = fileIds.map((id) => {
        return {
          fileId: id
        };
      });
    }

    return await filemanager.downloadFiles(files);
  } catch (exception) {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.FILEMANAGER_DOWNLOAD_FILE_FAILED,
      Description: `Downloading attachment for message failed.`,
      ExceptionDetails: exception
    });
    eventManager.handleError(exception);
  }
};

/**
 * Downloads files and returns the successfully downloaded files.
 * Errors are dispatched by EventManager.
 * @param fileData
 * @param filemanager
 */
export const downloadAttachmentsDirect = async (
  fileData: IUploadedFile[],
  filemanager: IFileManager,
  eventManager: EventManager,
  shouldTimeout: boolean,
  attachmentDownloadTimeout?: number
): Promise<File[]> => {
  const defaultAttachmentDownloadTimeout = 90000;
  try {
    if (shouldTimeout) {
      if (!attachmentDownloadTimeout) {
        attachmentDownloadTimeout = defaultAttachmentDownloadTimeout;
      }
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Attachment download timed out.'));
        }, attachmentDownloadTimeout);
      });

      return Promise.race<File[]>([filemanager.downloadFiles(fileData), timeout]);
    }
    return await filemanager.downloadFiles(fileData);
  } catch (exception) {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.FILEMANAGER_DOWNLOAD_FILE_FAILED,
      Description: `Downloading attachment for message failed.`,
      ExceptionDetails: exception
    });
    eventManager.handleError(exception);
  }
};

export const getAttachments = async (files: File[]): Promise<any[]> => {
  return Promise.all(
    files.map(async (file) => {
      if (file) {
        // NOTE: contentUrl is required for VideoAttachment but Webchat will remove blob URLs
        // https://github.com/microsoft/BotFramework-WebChat/blob/53cbf2c018442d9c0c925c55548b5153add2679c/packages/core/src/reducers/activities.js
        const url = await getDataURL(file);

        // Construct attachment object
        return {
          contentType: file.type,
          contentUrl: url,
          name: file.name,
          thumbnailUrl: file.type.match('(image|video|audio).*') ? url : undefined
        };
      }
    })
  );
};

export const getAttachmentSizes = (files: File[]): number[] => {
  return files.map((file) => {
    return file?.size;
  });
};
