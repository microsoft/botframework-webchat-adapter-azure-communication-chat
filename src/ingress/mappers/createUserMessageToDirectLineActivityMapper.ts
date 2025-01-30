import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { BOT_ADAPTIVE_CARD_METADATA_KEY, BOT_ADAPTIVE_CARD_METADATA_VALUE } from '../../types';
import { ChatClient, ChatMessageReceivedEvent } from '@azure/communication-chat';
import { CommunicationIdentifier, CommunicationUserIdentifier } from '@azure/communication-common';
import { LogLevel, Logger } from '../../log/Logger';
import { downloadAttachments, getAttachmentSizes, getAttachments, getIdFromIdentifier } from '../ingressHelpers';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { ActivityType } from '../../types/DirectLineTypes';
import { AdapterOptions } from '../../types/AdapterTypes';
import { AsyncMapper } from '../../types/AsyncMapper';
import { Constants } from '../../Constants';
import EventManager from '../../utils/EventManager';
import { GetStateFunction } from '../../types/AdapterTypes';
import { IFileManager } from '../../types/FileManagerTypes';
import { LogEvent } from '../../types/LogTypes';
import { Role } from '../../types/DirectLineTypes';
import { getClientId } from '../../utils/ClientIdToMessageId';
import uniqueId from '../../utils/uniqueId';
import { ErrorEventSubscriber } from '../../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../../types/ErrorEventTypes';

export async function convertMessageToActivity(
  eventManager: EventManager,
  messageId: string,
  content: string,
  createdOn: Date,
  sender: CommunicationIdentifier,
  senderDisplayName: string,
  currentUserId: string,
  threadId: string,
  enableAdaptiveCards?: boolean,
  enableMessageErrorHandler?: boolean,
  metadata?: Record<string, string>,
  files?: File[],
  tags?: string,
  sequenceId?: string
): Promise<ACSDirectLineActivity> {
  const senderUserId = getIdFromIdentifier(sender);

  let attachmentsData: any[];
  let attachmentSizes: number[];
  let textData: any;
  let valueData: any;
  let suggestedActions: any;
  let attachmentLayout: string;

  // If adaptive cards are enabled, check if this is an adaptive card
  const botContentType: string = metadata ? metadata[`${BOT_ADAPTIVE_CARD_METADATA_KEY}`] : undefined;
  if (botContentType === BOT_ADAPTIVE_CARD_METADATA_VALUE) {
    try {
      const acsMessageObject = JSON.parse(content);
      if (enableAdaptiveCards && acsMessageObject.attachments) {
        attachmentsData = [];
        attachmentsData = attachmentsData.concat(acsMessageObject.attachments);
        attachmentLayout = acsMessageObject.attachmentLayout;
      }
      suggestedActions = acsMessageObject ? acsMessageObject.suggestedActions : undefined;
      textData = acsMessageObject ? acsMessageObject.text : undefined;
    } catch (exception) {
      const errorMessage = 'Valid JSON object is expected.';
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
        Description: errorMessage,
        ACSRequesterUserId: currentUserId,
        MessageSender: (sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: createdOn.toISOString(),
        ChatThreadId: threadId,
        ChatMessageId: messageId,
        ExceptionDetails: exception
      });
      ErrorEventSubscriber.notifyErrorEvent({
        ErrorType: AdapterErrorEventType.INGRESS_MESSAGE_INVALID_JSON,
        ErrorMessage: exception.message,
        ErrorStack: exception.stack,
        ErrorDetails: (exception as any)?.details,
        Timestamp: createdOn.toISOString(),
        AcsChatDetails: {
          MessageId: messageId,
          ThreadId: threadId,
          MessageSenderId: (sender as CommunicationUserIdentifier).communicationUserId,
          RequesterUserId: currentUserId
        },
        AdditionalParams: {
          SenderDisplayName: senderDisplayName,
          MessageText: content,
          Metadata: metadata
        }
      });
      if (enableMessageErrorHandler) {
        const error = new Error(errorMessage);
        (error as any).details = {
          type: 'MESSAGE_PARSING_FAILED',
          actualMessage: content
        };
        eventManager.handleError(error);
      }
    }
  } else {
    // If this is not an adaptive card then set the text content
    // For adaptive cards the message content is a JSON payload, we should not send the raw data as content
    textData = content;
  }

  if (files && !attachmentsData) {
    attachmentsData = await getAttachments(files);
    attachmentSizes = getAttachmentSizes(files);
  }

  let clientActivityID = getClientId(messageId);
  if (clientActivityID === undefined) {
    clientActivityID = metadata?.clientActivityId;
  }

  let sequenceIdAsANumber = undefined;
  if (sequenceId && Math.sign(parseInt(sequenceId)) > 0) {
    sequenceIdAsANumber = parseInt(sequenceId);
  }

  const activity: ACSDirectLineActivity = {
    attachments: attachmentsData,
    channelId: Constants.ACS_CHANNEL,
    channelData: {
      'webchat:sequence-id': sequenceIdAsANumber,
      attachmentSizes: attachmentSizes,
      fromUserId: senderUserId,
      clientActivityID: clientActivityID,
      messageId,
      state: 'sent',
      tags: tags,
      metadata: metadata
    },
    conversation: { id: threadId },
    from: {
      id: senderUserId,
      name: senderDisplayName ? senderDisplayName : undefined,
      role: senderUserId === currentUserId ? Role.User : Role.Bot
    },
    id: messageId ? messageId : uniqueId(),
    text: textData,
    timestamp: new Date(createdOn).toISOString(),
    type: ActivityType.Message,
    messageid: messageId ? messageId : '',
    value: valueData,
    suggestedActions: suggestedActions,
    attachmentLayout: attachmentLayout
  };

  return activity;
}

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
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
        Description: errorMessage,
        ACSRequesterUserId: getState(StateKey.UserId),
        MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: event.createdOn.toISOString(),
        ChatThreadId: event.threadId,
        ChatMessageId: event.id
      });
      throw new Error(errorMessage);
    }

    let metadata = undefined;
    let files: File[];

    // Metadata is always defined on ChatMessageReceivedEvents, it is an empty object if there is no metadata
    if (event.metadata && Object.keys(event.metadata).length !== 0) {
      metadata = event.metadata;
      let fileIds: string[];
      try {
        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_REQUEST_DOWNLOAD_ATTACHMENTS,
          Description: 'Preparing to download attachments',
          ACSRequesterUserId: getState(StateKey.UserId),
          MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: event.createdOn.toISOString(),
          ChatThreadId: event.threadId,
          ChatMessageId: event.id
        });
        // Retrieve file ids and metadata to download attachments
        fileIds = filemanager.getFileIds(event.metadata);
        const fileMetadata = filemanager.getFileMetadata(event.metadata);
        if (fileIds) {
          files = await downloadAttachments(fileIds, fileMetadata, filemanager, eventManager);
        }
      } catch (exception) {
        Logger.logEvent(LogLevel.ERROR, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
          Description: 'Failed to download attachments',
          ACSRequesterUserId: getState(StateKey.UserId),
          MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: event.createdOn.toISOString(),
          ChatThreadId: event.threadId,
          ChatMessageId: event.id,
          ExceptionDetails: exception
        });
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
          }
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

    return await convertMessageToActivity(
      eventManager,
      event.id,
      event.message,
      event.createdOn,
      event.sender,
      event.senderDisplayName,
      currentUserId,
      event.threadId,
      options?.enableAdaptiveCards,
      options?.enableMessageErrorHandler,
      metadata,
      files,
      event.metadata?.tags,
      event.id
    );
  };
}
