import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import {
  ActivityType,
  DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
  IDirectLineActivity
} from '../../types/DirectLineTypes';
import { ChatClient, StreamingChatMessageChunkReceivedEvent } from '@azure/communication-chat';
import { IFileManager, LogLevel, Logger } from '../..';
import { downloadAttachments, getAttachments, getAttachmentSizes, getIdFromIdentifier } from '../ingressHelpers';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Constants } from '../../Constants';
import { GetStateFunction } from '../../types/AdapterTypes';
import { LogEvent } from '../../types/LogTypes';
import { Role } from '../../types/DirectLineTypes';
import uniqueId from '../../utils/uniqueId';
import EventManager from '../../utils/EventManager';
import { ErrorEventSubscriber } from '../../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../../types/ErrorEventTypes';
import { LoggerUtils } from '../../utils/LoggerUtils';

export const createStreamingMessageChunkToDirectLineActivityMapper = ({
  getState,
  isFirstChunk
}: {
  getState: GetStateFunction<ACSAdapterState>;
  isFirstChunk: boolean;
}): AsyncMapper<StreamingChatMessageChunkReceivedEvent, ACSDirectLineActivity> => {
  return () => async (event: StreamingChatMessageChunkReceivedEvent) => {
    const chatClient: ChatClient = getState(StateKey.ChatClient);
    const fileManager: IFileManager = getState(StateKey.FileManager);
    const eventManager: EventManager = getState(StateKey.EventManager);

    if (!chatClient) {
      const errorMessage = 'ACS Adapter: Failed to ingress streaming message chunk event without an active chatClient.';
      throw new Error(errorMessage);
    }

    const senderId = getIdFromIdentifier(event.sender);

    const activity: IDirectLineActivity = {
      channelId: Constants.ACS_CHANNEL,
      channelData: {
        'webchat:sequence-id': parseInt(event.id)
      },
      conversation: { id: getState(StateKey.ThreadId) },
      from: {
        id: senderId,
        name: event.senderDisplayName ? event.senderDisplayName : undefined,
        role: senderId === getState(StateKey.UserId) ? Role.User : Role.Bot
      },
      messageid: event.id,
      id: event.id ? event.id : uniqueId(),
      text: event.message,
      timestamp: event.editedOn.toISOString(),
      type: ActivityType.Typing //not message like for the edit message event
    };
    // If message contains metadata (tags, attachments or other metadata) include it in the Activity
    // Metadata is always defined on ChatMessageReceivedEvents, it is an empty object if there is no metadata
    if (event.metadata && Object.keys(event.metadata).length !== 0) {
      let files: File[];
      let attachmentsData: any[];
      let attachmentSizes: number[];

      try {
        // Retrieve file ids and metadata to download attachments
        const fileIds = fileManager.getFileIds(event.metadata);
        const fileMetadata = fileManager.getFileMetadata(event.metadata);
        if (fileIds) {
          files = await downloadAttachments(fileIds, fileMetadata, fileManager, eventManager);
          attachmentsData = await getAttachments(files);
          attachmentSizes = getAttachmentSizes(files);
        }
      } catch (exception) {
        LoggerUtils.logProcessingStreamingChatMessageChunkError(event, getState, exception);
        ErrorEventSubscriber.notifyErrorEvent({
          ErrorType: AdapterErrorEventType.MESSAGE_STREAMING_CHUNK_ATTACHMENT_DOWNLOAD_FAILED,
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

      if (attachmentsData && attachmentsData.length > 0) {
        activity.attachments = attachmentsData;
        activity.channelData.attachmentSizes = attachmentSizes;
      }

      if (event.metadata?.tags && event.metadata.tags.length > 0) {
        activity.channelData.tags = event.metadata?.tags;
      }
    }

    if (event.streamingMetadata) {
      activity.channelData.streamType = event.streamingMetadata.streamingMessageType;
      activity.channelData.streamSequence = event.streamingMetadata.streamingSequenceNumber;

      activity.entities = [
        {
          type: DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE,
          streamType: event.streamingMetadata.streamingMessageType,
          streamSequence: event.streamingMetadata.streamingSequenceNumber
        }
      ];
      // add stream id for all consequent chunks but not for the first one
      if (!isFirstChunk) {
        activity.channelData.streamId = event.id;
        activity.entities[0].streamId = event.id;
      }
    }

    return activity;
  };
};
