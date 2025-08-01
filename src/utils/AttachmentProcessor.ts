import { ChatMessage } from '@azure/communication-chat';
import { ACSAdapterState, StateKey } from '..';
import { downloadAttachmentsDirect } from '../ingress/ingressHelpers';
import { Logger, LogLevel } from '../log/Logger';
import { AdapterOptions, FileMetadata, GetStateFunction, IFileManager, IUploadedFile, LogEvent } from '../types';
import EventManager, { CustomEvent } from './EventManager';
import { LoggerUtils } from '../utils/LoggerUtils';

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
      LoggerUtils.logAttachmentEvent(
        getState,
        chatMessage,
        'ACS Adapter: attachments download queued: ' +
          fileIdsToDownload.map((file: IUploadedFile) => file.fileId).join(',') // remove content to protect sensitive user info,
      );
      files = await downloadAttachmentsDirect(
        fileIdsToDownload,
        filemanager,
        this,
        options?.shouldFileAttachmentDownloadTimeout,
        options?.fileAttachmentDownloadTimeout
      );
      LoggerUtils.logAttachmentEvent(
        getState,
        chatMessage,
        'ACS Adapter: attachments downloaded: ' + fileIdsToDownload.map((file: IUploadedFile) => file.fileId).join(',') // remove content to protect sensitive user info);
      );
      eventManager.raiseCustomEvent('acs-attachment-downloaded', { chatMessage, files });
    }
  } catch (exception) {
    LoggerUtils.logAttachmentErrorEvent(
      getState,
      chatMessage,
      LogEvent.ACS_ADAPTER_ATTACHMENT_DOWNLOAD_ERROR,
      'ACS Adapter: Failed to download attachments',
      exception
    );
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
    LoggerUtils.logProcessingAttachments(
      LogEvent.ACS_ADAPTER_PROCESSED_ATTACHMENTS,
      `ACS Adapter: Attachments processed on this thread ${[...Object.keys(pendingFileDownloads)]}`,
      messageId
    );
  }
  if (!Object.prototype.hasOwnProperty.call(pendingFileDownloads, messageId)) {
    pendingFileDownloads[messageId] = new Map<string, FileMetadata>();
    LoggerUtils.logProcessingAttachments(
      LogEvent.ACS_ADAPTER_ATTACHMENT_NEW,
      `ACS Adapter: New attachment download ${fileIds?.join(',')}`,
      messageId
    );
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
