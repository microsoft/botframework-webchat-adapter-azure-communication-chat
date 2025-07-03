import { BOT_ADAPTIVE_CARD_METADATA_KEY, BOT_ADAPTIVE_CARD_METADATA_VALUE } from '../types';
import { StreamingMessageMetadata } from '@azure/communication-chat';
import { CommunicationIdentifier, CommunicationUserIdentifier } from '@azure/communication-common';
import { getAttachmentSizes, getAttachments, getIdFromIdentifier } from '../ingress/ingressHelpers';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { ActivityType, DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE } from '../types/DirectLineTypes';
import { Constants } from '../Constants';
import EventManager from './EventManager';
import { Role } from '../types/DirectLineTypes';
import { getClientId } from './ClientIdToMessageId';
import uniqueId from './uniqueId';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';
import { logConvertFetchedMessageFailed } from './LoggerUtils';

export interface ChatEventMessage {
  messageId: string;
  content: string;
  createdOn: Date;
  editedOn?: Date;
  deletedOn?: Date;
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
  enableAdaptiveCardsResponses = true,
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
      if (enableAdaptiveCardsResponses) {
        // adaptive cards responses are sent as value in the message
        valueData = acsMessageObject?.value;
      }
      suggestedActions = acsMessageObject?.suggestedActions;
      textData = acsMessageObject?.text;
    } catch (exception) {
      const errorMessage = 'Valid JSON object is expected.';
      logConvertFetchedMessageFailed(eventMessage, errorMessage, exception);
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
      metadata: eventMessage.metadata,
      additionalMessageMetadata: {
        editedOn: eventMessage.editedOn?.toISOString(),
        deletedOn: eventMessage.deletedOn?.toISOString()
      }
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
