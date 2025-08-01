import { CommunicationIdentifier, CommunicationIdentifierKind, getIdentifierKind } from '@azure/communication-common';
import { FileMetadata, IFileManager, IUploadedFile } from '../types/FileManagerTypes';
import { LogEvent } from '../types/LogTypes';
import EventManager from '../utils/EventManager';
import { ACSAdapterState } from '../models/ACSAdapterState';
import {
  checkDuplicateMessage,
  checkDuplicateParticipantMessage,
  createParticipantMessageKeyWithMessage,
  createParticipantMessageKeyWithParticipantsEvent
} from '../utils/MessageComparison';
import { ChatEqualityFields, GetStateFunction } from '../types/AdapterTypes';
import { ChatMessage, ParticipantsAddedEvent, ParticipantsRemovedEvent } from '@azure/communication-chat';
import { LoggerUtils } from '../utils/LoggerUtils';

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
    LoggerUtils.logFileManagerDownloadFileFailed(exception);
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
    LoggerUtils.logFileManagerDownloadFileFailed(exception);
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

export interface ProcessChatMessageEventProps {
  id: string;
  message: string;
  createdOn: Date;
  editedOn?: Date;
  deletedOn?: Date;
  metadata?: { [key: string]: any };
  sender: CommunicationIdentifierKind;
  threadId: string;
}

/**
 * Processes and caches a new chat text message if it has not been processed before.
 *
 * @param messageCache - A map to store processed messages with their IDs as keys.
 * @param event - The chat message received event containing message details.
 * @param getState - A function to get the current state of the ACS adapter.
 * @param fileManager - An interface to manage file-related operations.
 * @param messageTypeLogString - A string to log the type of message being processed.
 * @returns A boolean indicating whether the message was already processed.
 */
export const cacheTextMessageIfNeeded = (
  messageCache: Map<string, ChatEqualityFields>,
  event: ProcessChatMessageEventProps,
  getState: GetStateFunction<ACSAdapterState>,
  fileManager: IFileManager,
  processingLogEvent: LogEvent
): boolean => {
  const isProcessed = checkDuplicateMessage(messageCache, event.id, {
    content: event.message,
    deletedOn: event.deletedOn,
    updatedOn: event.editedOn,
    fileIds: fileManager?.getFileIds(event.metadata)
  });
  if (!isProcessed) {
    LoggerUtils.logProcessingTextMessage(getState, event, processingLogEvent);
    messageCache.set(event.id, {
      content: event.message,
      updatedOn: event.editedOn,
      deletedOn: event.deletedOn,
      fileIds: fileManager?.getFileIds(event.metadata)
    });
  }
  return isProcessed;
};

export const isDuplicateMessage = (
  message: ChatMessage,
  messageCache: Map<string, ChatEqualityFields>,
  fileManager: IFileManager
): boolean => {
  switch (message.type) {
    case 'text':
      return checkDuplicateMessage(messageCache, message.id, {
        content: message.content.message,
        updatedOn: message.editedOn,
        deletedOn: message.deletedOn,
        fileIds: fileManager?.getFileIds(message.metadata)
      });
    case 'participantAdded': {
      const key = createParticipantMessageKeyWithMessage(message);
      return checkDuplicateParticipantMessage(messageCache, key, {
        addedParticipants: message.content.participants
      });
    }
    case 'participantRemoved': {
      const key = createParticipantMessageKeyWithMessage(message);
      return checkDuplicateParticipantMessage(messageCache, key, {
        removedParticipants: message.content.participants
      });
    }
    default:
      LoggerUtils.logUnsupportedMessageType(message);
      return false;
  }
};

export const updateMessageCacheWithMessage = (
  message: ChatMessage,
  messageCache: Map<string, ChatEqualityFields>,
  fileManager: IFileManager
): void => {
  switch (message.type) {
    case 'text': {
      messageCache.set(message.id, {
        content: message.content.message,
        updatedOn: message.editedOn,
        deletedOn: message.deletedOn,
        fileIds: fileManager?.getFileIds(message.metadata)
      });
      break;
    }
    case 'participantAdded': {
      const key = createParticipantMessageKeyWithMessage(message);
      messageCache.set(key, {
        addedParticipants: message.content.participants
      });
      break;
    }
    case 'participantRemoved': {
      const key = createParticipantMessageKeyWithMessage(message);
      messageCache.set(key, {
        removedParticipants: message.content.participants
      });
      break;
    }
    default: {
      LoggerUtils.logUnsupportedMessageType(message);
      break;
    }
  }
};

export const cacheParticipantAddedEventIfNeeded = (
  messageCache: Map<string, ChatEqualityFields>,
  event: ParticipantsAddedEvent,
  getState: GetStateFunction<ACSAdapterState>
): boolean => {
  const key = createParticipantMessageKeyWithParticipantsEvent(event);
  const isProcessed = checkDuplicateParticipantMessage(messageCache, key, {
    addedParticipants: event.participantsAdded
  });
  if (!isProcessed) {
    LoggerUtils.logProcessingParticipantAddedEvent(getState, event);
    messageCache.set(key, {
      addedParticipants: event.participantsAdded
    });
  }
  return isProcessed;
};

export const cacheParticipantRemovedEventIfNeeded = (
  messageCache: Map<string, ChatEqualityFields>,
  event: ParticipantsRemovedEvent,
  getState: GetStateFunction<ACSAdapterState>
): boolean => {
  const key = createParticipantMessageKeyWithParticipantsEvent(event);
  const isProcessed = checkDuplicateParticipantMessage(messageCache, key, {
    removedParticipants: event.participantsRemoved
  });
  if (!isProcessed) {
    LoggerUtils.logProcessingParticipantRemovedEvent(getState, event);
    messageCache.set(key, {
      removedParticipants: event.participantsRemoved
    });
  }
  return isProcessed;
};
