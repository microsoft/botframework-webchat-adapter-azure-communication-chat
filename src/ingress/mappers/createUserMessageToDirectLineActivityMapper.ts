import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { BOT_ADAPTIVE_CARD_METADATA_KEY, BOT_ADAPTIVE_CARD_METADATA_VALUE } from '../../types';
import { ChatClient, ChatMessageReceivedEvent, StreamingMessageMetadata } from '@azure/communication-chat';
import { CommunicationIdentifier, CommunicationUserIdentifier } from '@azure/communication-common';
import { LogLevel, Logger } from '../../log/Logger';
import { downloadAttachments, getAttachmentSizes, getAttachments, getIdFromIdentifier } from '../ingressHelpers';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { ActivityType, DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE } from '../../types/DirectLineTypes';
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

export interface ChatEventMessage {
  messageId: string;
  content: string;
  createdOn: Date;
  sender: CommunicationIdentifier;
  senderDisplayName: string;
  currentUserId: string;
  threadId: string;
  metadata?: Record<string, string>;
  tags?: string;
  sequenceId?: string;
  streamingMetadata?: StreamingMessageMetadata;
  files?: File[];
}

export async function convertMessageToActivity(
  eventManager: EventManager,
  eventMessage: ChatEventMessage,
  enableAdaptiveCards?: boolean,
  enableMessageErrorHandler?: boolean
): Promise<ACSDirectLineActivity> {
  const senderUserId = getIdFromIdentifier(eventMessage.sender);

  let attachmentsData: any[];
  let attachmentSizes: number[];
  let textData: any;
  let valueData: any;
  let suggestedActions: any;
  let attachmentLayout: string;

  // If adaptive cards are enabled, check if this is an adaptive card
  const botContentType: string = eventMessage.metadata
    ? eventMessage.metadata[`${BOT_ADAPTIVE_CARD_METADATA_KEY}`]
    : undefined;
  if (botContentType === BOT_ADAPTIVE_CARD_METADATA_VALUE) {
    try {
      const acsMessageObject = JSON.parse(eventMessage.content);
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
        ACSRequesterUserId: eventMessage.currentUserId,
        MessageSender: (eventMessage.sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: eventMessage.createdOn.toISOString(),
        ChatThreadId: eventMessage.threadId,
        ChatMessageId: eventMessage.messageId,
        ExceptionDetails: exception
      });
      ErrorEventSubscriber.notifyErrorEvent({
        ErrorType: AdapterErrorEventType.INGRESS_MESSAGE_INVALID_JSON,
        ErrorMessage: exception.message,
        ErrorStack: exception.stack,
        ErrorDetails: (exception as any)?.details,
        Timestamp: eventMessage.createdOn.toISOString(),
        AcsChatDetails: {
          MessageId: eventMessage.messageId,
          ThreadId: eventMessage.threadId,
          MessageSenderId: (eventMessage.sender as CommunicationUserIdentifier).communicationUserId,
          RequesterUserId: eventMessage.currentUserId
        },
        AdditionalParams: {
          SenderDisplayName: eventMessage.senderDisplayName,
          MessageText: eventMessage.content,
          Metadata: eventMessage.metadata
        }
      });
      if (enableMessageErrorHandler) {
        const error = new Error(errorMessage);
        (error as any).details = {
          type: 'MESSAGE_PARSING_FAILED',
          actualMessage: eventMessage.content
        };
        eventManager.handleError(error);
      }
    }
  } else {
    // If this is not an adaptive card then set the text content
    // For adaptive cards the message content is a JSON payload, we should not send the raw data as content
    textData = eventMessage.content;
  }

  if (eventMessage.files && !attachmentsData) {
    attachmentsData = await getAttachments(eventMessage.files);
    attachmentSizes = getAttachmentSizes(eventMessage.files);
  }

  let clientActivityID = getClientId(eventMessage.messageId);
  if (clientActivityID === undefined) {
    clientActivityID = eventMessage.metadata?.clientActivityId;
  }

  let sequenceIdAsANumber = undefined;
  if (eventMessage.sequenceId && Math.sign(parseInt(eventMessage.sequenceId)) > 0) {
    sequenceIdAsANumber = parseInt(eventMessage.sequenceId);
  }

  const activity: ACSDirectLineActivity = {
    attachments: attachmentsData,
    channelId: Constants.ACS_CHANNEL,
    channelData: {
      'webchat:sequence-id': sequenceIdAsANumber,
      attachmentSizes: attachmentSizes,
      fromUserId: senderUserId,
      clientActivityID: clientActivityID,
      messageId: eventMessage.messageId,
      state: 'sent',
      tags: eventMessage.metadata?.tags,
      metadata: eventMessage.metadata
    },
    conversation: { id: eventMessage.threadId },
    from: {
      id: senderUserId,
      name: eventMessage.senderDisplayName ? eventMessage.senderDisplayName : undefined,
      role: senderUserId === eventMessage.currentUserId ? Role.User : Role.Bot
    },
    id: eventMessage.messageId ? eventMessage.messageId : uniqueId(),
    text: textData,
    timestamp: new Date(eventMessage.createdOn).toISOString(),
    type: ActivityType.Message,
    messageid: eventMessage.messageId ? eventMessage.messageId : '',
    value: valueData,
    suggestedActions: suggestedActions,
    attachmentLayout: attachmentLayout
  };

  if (eventMessage.streamingMetadata) {
    activity.channelData.streamType = eventMessage.streamingMetadata.streamingMessageType;
    activity.channelData.streamId = eventMessage.messageId;

    activity.entities = [
      {
        type: DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
        streamType: eventMessage.streamingMetadata.streamingMessageType,
        streamId: eventMessage.messageId
      }
    ];
  }

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
      options?.enableMessageErrorHandler
    );
  };
}
