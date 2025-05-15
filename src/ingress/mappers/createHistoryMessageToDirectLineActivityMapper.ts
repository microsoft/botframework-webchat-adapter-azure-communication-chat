import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { ChatClient, ChatMessage } from '@azure/communication-chat';
import { LogLevel, Logger } from '../../log/Logger';

import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AdapterOptions } from '../../types/AdapterTypes';
import { AsyncMapper } from '../../types/AsyncMapper';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import EventManager from '../../utils/EventManager';
import { GetStateFunction } from '../../types/AdapterTypes';
import { IFileManager } from '../../types/FileManagerTypes';
import { LogEvent } from '../../types/LogTypes';
import { convertMessageToActivity, ChatEventMessage } from './createUserMessageToDirectLineActivityMapper';
import { ErrorEventSubscriber } from '../../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../../types/ErrorEventTypes';

export function createHistoryAttachmentMessageToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<{ message: ChatMessage; files: File[] }, ACSDirectLineActivity> {
  return () =>
    async ({ message, files }: { message: ChatMessage; files: File[] }) => {
      const options: AdapterOptions = getState(StateKey.AdapterOptions);
      const eventManager: EventManager = getState(StateKey.EventManager);
      const threadId: string = getState(StateKey.ThreadId);
      const currentUserId: string = getState(StateKey.UserId);

      if (!files) {
        return null;
      }

      const eventMessage = createEventMessage(message, threadId, currentUserId, files);
      return await convertMessageToActivity(
        eventManager,
        eventMessage,
        options?.enableAdaptiveCards,
        options?.enableMessageErrorHandler
      );
    };
}

export default function createHistoryMessageToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatMessage, ACSDirectLineActivity> {
  return () => async (message: ChatMessage) => {
    const chatClient: ChatClient = getState(StateKey.ChatClient);
    const options: AdapterOptions = getState(StateKey.AdapterOptions);
    const filemanager: IFileManager = getState(StateKey.FileManager);
    const eventManager: EventManager = getState(StateKey.EventManager);
    const threadId: string = getState(StateKey.ThreadId);
    const currentUserId: string = getState(StateKey.UserId);

    if (!chatClient) {
      const errorMessage = 'ACS Adapter: Failed to ingress history message without an active chatClient.';
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
        Description: errorMessage,
        ACSRequesterUserId: getState(StateKey.UserId),
        MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: message.createdOn.toISOString(),
        ChatMessageId: message.id
      });
      throw new Error(errorMessage);
    }

    let files: File[];
    let fileIds: string[];
    try {
      // Retrieve file ids and metadata to download attachments
      fileIds = filemanager.getFileIds(message.metadata);
      if (fileIds) {
        eventManager.raiseCustomEvent('queue-attachment-download', { chatMessage: message, options });
        return null;
      }
    } catch (exception) {
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
        Description: 'Failed to queue attachments download',
        ACSRequesterUserId: getState(StateKey.UserId),
        MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: message.createdOn.toISOString(),
        ChatMessageId: message.id,
        ExceptionDetails: exception
      });
      ErrorEventSubscriber.notifyErrorEvent({
        ErrorType: AdapterErrorEventType.HISTORY_MESSAGE_METADATA_FILEID_FETCH_FAILED,
        ErrorMessage: exception.message,
        ErrorStack: exception.stack,
        ErrorDetails: (exception as any)?.details,
        Timestamp: message.createdOn.toISOString(),
        AcsChatDetails: {
          MessageId: message.id,
          ThreadId: threadId,
          MessageSenderId: (message.sender as CommunicationUserIdentifier).communicationUserId,
          RequesterUserId: getState(StateKey.UserId)
        },
        AdditionalParams: {
          MessageDetails: message
        }
      });
      if (options?.enableMessageErrorHandler) {
        const errorMessage = 'Failed to download attachments.';
        const error = new Error(errorMessage);
        (error as any).details = {
          type: 'QUEUE_ATTACHMENT_DOWNLOAD_FAILED',
          actualMessage: fileIds
        };
        eventManager.handleError(exception);
      }
    }

    const eventMessage = createEventMessage(message, threadId, currentUserId, files);
    return await convertMessageToActivity(
      eventManager,
      eventMessage,
      options?.enableAdaptiveCards,
      options?.enableMessageErrorHandler
    );
  };
}

const createEventMessage = (
  message: ChatMessage,
  threadId: string,
  currentUserId: string,
  files?: File[]
): ChatEventMessage => {
  return {
    messageId: message.id,
    content: message.content?.message,
    createdOn: message.createdOn,
    sender: message.sender,
    senderDisplayName: message.senderDisplayName,
    currentUserId,
    threadId,
    metadata: message.metadata,
    tags: message.metadata?.tags,
    sequenceId: message.id,
    files
  };
};
