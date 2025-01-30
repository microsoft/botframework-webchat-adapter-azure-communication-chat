import { ChatMessage } from '@azure/communication-chat';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { ACSAdapterState, StateKey } from '..';
import { downloadAttachmentsDirect } from '../ingress/ingressHelpers';
import { Logger, LogLevel } from '../log/Logger';
import { AdapterOptions, FileMetadata, GetStateFunction, IFileManager, IUploadedFile, LogEvent } from '../types';
import EventManager, { CustomEvent } from './EventManager';

export const queueAttachmentDownloading = async (
  event: CustomEvent,
  pendingFileDownloads: { [key: string]: Map<string, FileMetadata> },
  getState: GetStateFunction<ACSAdapterState>
): Promise<void> => {
  const {
    chatMessage,
    options
  }: {
    chatMessage: ChatMessage;
    options: AdapterOptions;
  } = event.detail.payload;
  let files: File[];
  let fileIds: string[];
  const eventManager: EventManager = getState(StateKey.EventManager);
  const filemanager: IFileManager = getState(StateKey.FileManager);
  try {
    fileIds = filemanager.getFileIds(chatMessage.metadata);
    const fileMetadata = filemanager.getFileMetadata(chatMessage.metadata);
    if (fileIds) {
      const fileIdsToDownload = findUnprocessedFileIds(pendingFileDownloads, chatMessage.id, fileIds, fileMetadata);
      if (fileIdsToDownload?.length <= 0) {
        return;
      }
      Logger.logEvent(LogLevel.INFO, {
        Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
        Description:
          'ACS Adapter: attachments download queued: ' +
          fileIdsToDownload.map((file: IUploadedFile) => file.fileId).join(','), // remove content to protect sensitive user info
        ACSRequesterUserId: getState(StateKey.UserId),
        MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: chatMessage.createdOn.toISOString(),
        ChatMessageId: chatMessage.id
      });
      files = await downloadAttachmentsDirect(
        fileIdsToDownload,
        filemanager,
        this,
        options?.shouldFileAttachmentDownloadTimeout,
        options?.fileAttachmentDownloadTimeout
      );
      Logger.logEvent(LogLevel.INFO, {
        Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
        Description: 'ACS Adapter: attachments downloaded: ', // remove content to protect sensitive user info
        ACSRequesterUserId: getState(StateKey.UserId),
        MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: chatMessage.createdOn.toISOString(),
        ChatMessageId: chatMessage.id
      });
      eventManager.raiseCustomEvent('acs-attachment-downloaded', { chatMessage, files });
    }
  } catch (exception) {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_ATTACHMENT_DOWNLOAD_ERROR,
      Description: 'ACS Adapter: Failed to download attachments',
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: chatMessage.createdOn.toISOString(),
      ChatMessageId: chatMessage.id,
      ExceptionDetails: exception
    });
    if (options?.enableMessageErrorHandler) {
      const errorMessage = 'Failed to download attachments.';
      const error = new Error(errorMessage);
      (error as any).details = {
        type: 'ATTACHMENT_DOWNLOAD_FAILED',
        actualMessage: fileIds
      };
      eventManager.handleError(exception);
    }
  }
};

const findUnprocessedFileIds = (
  pendingFileDownloads: { [key: string]: Map<string, FileMetadata> },
  messageId: string,
  fileIds: string[],
  fileMetadata: FileMetadata[]
): IUploadedFile[] => {
  const fileIdsToDownload: IUploadedFile[] = [];
  if (pendingFileDownloads) {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_PROCESSED_ATTACHMENTS,
      Description: `ACS Adapter: Attachments processed on this thread ${[...Object.keys(pendingFileDownloads)]}`,
      TimeStamp: new Date().toISOString(),
      ChatMessageId: messageId
    });
  }
  if (!Object.prototype.hasOwnProperty.call(pendingFileDownloads, messageId)) {
    pendingFileDownloads[messageId] = new Map<string, FileMetadata>();
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_ATTACHMENT_NEW,
      Description: `ACS Adapter: New attachment download ${fileIds?.join(',')}`,
      TimeStamp: new Date().toISOString(),
      ChatMessageId: messageId
    });
    for (let i = 0; i < fileIds.length; ++i) {
      fileIdsToDownload.push({ fileId: fileIds[i], metadata: fileMetadata[i] });
      pendingFileDownloads[messageId].set(fileIds[i], fileMetadata[i]);
    }
  } else {
    for (let i = 0; i < fileIds.length; ++i) {
      if (!pendingFileDownloads[messageId].has(fileIds[i])) {
        fileIdsToDownload.push({ fileId: fileIds[i], metadata: fileMetadata[i] });
        pendingFileDownloads[messageId].set(fileIds[i], fileMetadata[i]);
      }
    }
  }

  return fileIdsToDownload;
};
