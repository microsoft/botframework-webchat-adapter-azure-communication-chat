import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { ActivityType, IDirectLineActivity } from '../../types/DirectLineTypes';
import { ChatClient, ChatMessageEditedEvent } from '@azure/communication-chat';
import { IFileManager } from '../..';
import { downloadAttachments, getAttachmentSizes, getAttachments, getIdFromIdentifier } from '../ingressHelpers';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Constants } from '../../Constants';
import EventManager from '../../utils/EventManager';
import { GetStateFunction } from '../../types/AdapterTypes';
import { Role } from '../../types/DirectLineTypes';
import uniqueId from '../../utils/uniqueId';
import { ErrorEventSubscriber } from '../../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../../types/ErrorEventTypes';
import { logEditEventFailedMetadataParsing } from '../../utils/LoggerUtils';

export default function createEditedMessageToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatMessageEditedEvent, ACSDirectLineActivity> {
  return () => async (event: ChatMessageEditedEvent) => {
    const chatClient: ChatClient = getState(StateKey.ChatClient);
    const filemanager: IFileManager = getState(StateKey.FileManager);
    const eventManager: EventManager = getState(StateKey.EventManager);

    if (!chatClient) {
      const errorMessage = 'ACS Adapter: Failed to ingress edited message without an active chatClient.';
      throw new Error(errorMessage);
    }

    const senderId = getIdFromIdentifier(event.sender);

    const activity: IDirectLineActivity = {
      channelId: Constants.ACS_CHANNEL,
      channelData: {
        'webchat:sequence-id': parseInt(event.id),
        additionalMessageMetadata: {
          editedOn: event.editedOn.toISOString()
        }
      },
      conversation: { id: getState(StateKey.UserId) },
      from: {
        id: senderId,
        name: event.senderDisplayName,
        role: senderId === getState(StateKey.UserId) ? Role.User : Role.Bot
      },
      messageid: event.id,
      id: event.id ? event.id : uniqueId(),
      text: event.message,
      timestamp: event.createdOn.toISOString(),
      type: ActivityType.Message
    };

    // If message contains metadata (tags, attachments or other metadata) include it in the Activity
    // Metadata is always defined on ChatMessageReceivedEvents, it is an empty object if there is no metadata
    if (event.metadata && Object.keys(event.metadata).length !== 0) {
      let files: File[];
      let attachmentsData: any[];
      let attachmentSizes: number[];

      try {
        // Retrieve file ids and metadata to download attachments
        const fileIds = filemanager.getFileIds(event.metadata);
        const fileMetadata = filemanager.getFileMetadata(event.metadata);
        if (fileIds) {
          files = await downloadAttachments(fileIds, fileMetadata, filemanager, eventManager);
          attachmentsData = await getAttachments(files);
          attachmentSizes = getAttachmentSizes(files);
        }
      } catch (exception) {
        logEditEventFailedMetadataParsing(event, exception, getState);
        ErrorEventSubscriber.notifyErrorEvent({
          ErrorType: AdapterErrorEventType.EDITED_MESSAGE_ATTACHMENT_DOWNLOAD_FAILED,
          ErrorMessage: exception.message,
          ErrorStack: exception.stack,
          ErrorDetails: (exception as any)?.details,
          Timestamp: event.editedOn.toISOString(),
          AcsChatDetails: {
            MessageId: event.id,
            ThreadId: event.threadId,
            MessageSenderId: (event.sender as CommunicationUserIdentifier).communicationUserId,
            RequesterUserId: getState(StateKey.UserId)
          },
          AdditionalParams: {
            MessageEditedEvent: event
          },
          CorrelationVector: exception?.request?.headers?.get('ms-cv')
        });
        eventManager.handleError(exception);
      }

      activity.channelData.metadata = event.metadata;

      if (attachmentsData) {
        activity.attachments = attachmentsData;
        activity.channelData.attachmentSizes = attachmentSizes;
      }

      if (event.metadata?.tags) {
        activity.channelData.tags = event.metadata?.tags;
      }
    }

    return activity;
  };
}
