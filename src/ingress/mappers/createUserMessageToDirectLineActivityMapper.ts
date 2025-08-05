import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { ChatClient, ChatMessageReceivedEvent } from '@azure/communication-chat';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { downloadAttachments } from '../ingressHelpers';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AdapterOptions } from '../../types/AdapterTypes';
import { AsyncMapper } from '../../types/AsyncMapper';
import EventManager from '../../utils/EventManager';
import { GetStateFunction } from '../../types/AdapterTypes';
import { IFileManager } from '../../types/FileManagerTypes';
import { ErrorEventSubscriber } from '../../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../../types/ErrorEventTypes';
import { ChatEventMessage, convertMessageToActivity } from '../../utils/ConvertMessageUtils';
import { LoggerUtils } from '../../utils/LoggerUtils';

export default function createUserMessageToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatMessageReceivedEvent, ACSDirectLineActivity> {
  return () => async (event: ChatMessageReceivedEvent) => {
    const chatClient: ChatClient = getState(StateKey.ChatClient);
    const options: AdapterOptions = getState(StateKey.AdapterOptions);
    const filemanager: IFileManager = getState(StateKey.FileManager);
    const eventManager: EventManager = getState(StateKey.EventManager);
    const currentUserId: string = getState(StateKey.UserId);

    if (!chatClient) {
      const errorMessage = 'ACS Adapter: Failed to ingress message without an active chatClient.';
      LoggerUtils.logUserMessageIngressFailed(getState, event, errorMessage);
      throw new Error(errorMessage);
    }

    let metadata = undefined;
    let files: File[];

    // Metadata is always defined on ChatMessageReceivedEvents, it is an empty object if there is no metadata
    if (event.metadata && Object.keys(event.metadata).length !== 0) {
      metadata = event.metadata;
      let fileIds: string[];
      try {
        LoggerUtils.logRequestDownloadAttachments(getState, event);
        // Retrieve file ids and metadata to download attachments
        fileIds = filemanager.getFileIds(event.metadata);
        const fileMetadata = filemanager.getFileMetadata(event.metadata);
        if (fileIds) {
          files = await downloadAttachments(fileIds, fileMetadata, filemanager, eventManager);
        }
      } catch (exception) {
        LoggerUtils.logDownloadAttachmentsFailed(getState, event, exception);
        ErrorEventSubscriber.notifyErrorEvent({
          ErrorType: AdapterErrorEventType.NEW_MESSAGE_DOWNLOAD_ATTACHMENT_FAILED,
          ErrorMessage: exception.message,
          ErrorStack: exception.stack,
          ErrorDetails: (exception as any)?.details,
          Timestamp: event.createdOn.toISOString(),
          AcsChatDetails: {
            MessageId: event.id,
            ThreadId: event.threadId,
            MessageSenderId: (event.sender as CommunicationUserIdentifier).communicationUserId,
            RequesterUserId: currentUserId
          },
          AdditionalParams: {
            SenderDisplayName: event.senderDisplayName,
            MessageText: event.message,
            Metadata: event.metadata
          },
          CorrelationVector: exception?.request?.headers?.get('ms-cv')
        });
        if (options?.enableMessageErrorHandler) {
          const errorMessage = 'Failed to download attachments.';
          const error = new Error(errorMessage);
          (error as any).details = {
            type: 'ATTACHMENT_DOWNLOAD_FAILED',
            actualMessage: fileIds
          };
          eventManager.handleError(error);
        }
      }
    }
    const eventMessage: ChatEventMessage = {
      messageId: event.id,
      content: event.message,
      createdOn: event.createdOn,
      sender: event.sender,
      senderDisplayName: event.senderDisplayName,
      currentUserId,
      threadId: event.threadId,
      metadata: metadata,
      tags: event.metadata?.tags,
      sequenceId: event.id,
      streamingMetadata: event.streamingMetadata,
      files
    };

    return await convertMessageToActivity(
      eventManager,
      eventMessage,
      options?.enableAdaptiveCards,
      options?.enableAdaptiveCardsResponses,
      options?.enableMessageErrorHandler
    );
  };
}
