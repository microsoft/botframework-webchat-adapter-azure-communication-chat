// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../types/external.d.ts" />

import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import { ChatThreadClient, SendMessageOptions, SendMessageRequest } from '@azure/communication-chat';
import { FileMetadata, IFileManager } from '../types/FileManagerTypes';
import { LogLevel, Logger } from '../log/Logger';

import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { AcsMessageFormat } from '../models/AcsMessageFormat';
import { ActivityType } from '../types/DirectLineTypes';
import { BotAttachment } from '../models/BotAttachment';
import { EgressMiddleware } from '../libs/applyEgressMiddleware';
import EventManager from '../utils/EventManager';
import { LogEvent } from '../types/LogTypes';
import { setMessageIdToClientId } from '../utils/ClientIdToMessageId';
import packageInfo from '../../package.json';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';

const TelemetryOptions = {
  requestOptions: {
    customHeaders: {
      'x-ms-useragent': `acs-webchat-adapter-${packageInfo.version} azsdk-js-communication-chat/${packageInfo.dependencies['@azure/communication-chat']}`
    }
  }
};
export default function createEgressMessageActivityMiddleware(): EgressMiddleware<
  ACSDirectLineActivity,
  ACSAdapterState
> {
  return ({ getState }) =>
    (next) =>
    async (activity: ACSDirectLineActivity) => {
      if (activity.type !== ActivityType.Message) {
        return next(activity);
      }
      const chatThreadClient: ChatThreadClient = getState(StateKey.ChatThreadClient);
      const userDisplayName: string = getState(StateKey.UserDisplayName);
      const eventManager: EventManager = getState(StateKey.EventManager);
      const fileManager: IFileManager = getState(StateKey.FileManager);

      if (!chatThreadClient) {
        const errorMessage = 'ACS Adapter: Failed to egress message without an active chatThreadClient.';
        Logger.logEvent(LogLevel.ERROR, {
          Event: LogEvent.ACS_ADAPTER_EGRESS_FAILED,
          Description: errorMessage,
          ACSRequesterUserId: getState(StateKey.UserId),
          TimeStamp: activity.timestamp,
          ChatThreadId: getState(StateKey.ThreadId),
          ChatMessageId: activity.messageid
        });
        throw new Error(errorMessage);
      }

      Logger.logEvent(LogLevel.INFO, {
        Event: LogEvent.ACS_ADAPTER_EGRESS_MESSAGE,
        Description: 'Convert activity to egress ACS message',
        ACSRequesterUserId: getState(StateKey.UserId),
        TimeStamp: activity.timestamp,
        ChatThreadId: getState(StateKey.ThreadId),
        ChatMessageId: activity.messageid
      });

      const { text, value } = activity;
      const uniqueClientMessageId = Date.now().toString();
      (activity as any).clientmessageid = uniqueClientMessageId;

      let content = text || '';
      const complexContent: AcsMessageFormat = {};

      // Add file ids if present
      const fileIds: string[] = activity.channelData?.uploadedFiles?.map((file) => {
        return file?.fileId;
      });
      const fileIdsProperty: Record<string, string> = fileIds ? fileManager.createFileIdProperty(fileIds) : undefined;

      // Add file metadata if present
      const fileMetadata: FileMetadata[] = activity.channelData?.uploadedFiles?.map((file) => {
        return file?.metadata;
      });
      const fileMetadataProperty: Record<string, string> = fileMetadata
        ? fileManager.createFileMetadataProperty(fileMetadata)
        : undefined;

      // Add attachment if present
      const attachment: BotAttachment = fileManager.createBotAttachment({
        ...fileIdsProperty,
        ...fileMetadataProperty
      });
      if (attachment && Object.keys(attachment).length !== 0) {
        complexContent.attachments = [attachment];
      }

      // Add tags if present
      const tags: string = activity.channelData?.tags;
      const tagsProperty: Record<string, string> = tags ? { tags: tags } : undefined;

      let metadata = activity.channelData?.metadata;

      // include client message id as a metadata if present
      if (activity.channelData?.clientActivityID) {
        metadata = { ...metadata, ...{ clientActivityId: activity.channelData.clientActivityID.toString() } };
      }

      // Add value if present
      if (value) {
        complexContent.value = value;
      }

      // Add attachmentLayout if present
      if (activity.attachmentLayout) {
        complexContent.attachmentLayout = activity.attachmentLayout;
      }

      if (JSON.stringify(complexContent) !== '{}') {
        // Add text if present
        if (text) {
          complexContent.text = text;
        }
        content = JSON.stringify(complexContent);
        metadata = {
          ...metadata,
          ...{ 'microsoft.azure.communication.chat.bot.contenttype': 'azurebotservice.adaptivecard' }
        };
      }

      // Message Options
      const sendMessageOptions: SendMessageOptions = {
        ...TelemetryOptions,
        senderDisplayName: userDisplayName ? userDisplayName : undefined
      };

      // Metadata consists of tags, fileIds and any additional metadata passed in the activity
      if (metadata || tags || fileIds) {
        sendMessageOptions.metadata = {
          ...metadata,
          ...tagsProperty,
          ...fileIdsProperty,
          ...fileMetadataProperty
        };
      }

      // Message Request
      const sendMessageRequest: SendMessageRequest = {
        content: content
      };

      try {
        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_EGRESS_SEND_MESSAGE,
          Description: 'Convert activity to egress ACS message',
          ACSRequesterUserId: getState(StateKey.UserId),
          TimeStamp: activity.timestamp,
          ChatThreadId: getState(StateKey.ThreadId),
          ChatMessageId: activity.messageid
        });
        const sentResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
        setMessageIdToClientId(sentResult.id, activity.channelData.clientActivityID as string);

        Logger.logEvent(LogLevel.DEBUG, {
          Event: LogEvent.ACS_ADAPTER_SEND_MESSAGE_SUCCESS,
          Description: `Adapter: Successfully sent a message with messageid ${sentResult.id}.`,
          CustomProperties: sendMessageRequest,
          ACSRequesterUserId: getState(StateKey.UserId),
          TimeStamp: new Date().toISOString(),
          ChatThreadId: getState(StateKey.ThreadId),
          ChatMessageId: activity.messageid,
          ClientActivityId: activity?.channelData.clientActivityID as string
        });
      } catch (exception) {
        Logger.logEvent(LogLevel.ERROR, {
          Event: LogEvent.ACS_ADAPTER_SEND_MESSAGE_FAILED,
          Description: `Send message failed.`,
          CustomProperties: sendMessageRequest,
          ACSRequesterUserId: getState(StateKey.UserId),
          TimeStamp: new Date().toISOString(),
          ChatThreadId: getState(StateKey.ThreadId),
          ChatMessageId: activity.messageid,
          ClientActivityId: activity?.channelData.clientActivityID as string,
          ExceptionDetails: exception
        });
        ErrorEventSubscriber.notifyErrorEvent({
          StatusCode: exception.response?.status,
          ErrorType: AdapterErrorEventType.EGRESS_SEND_MESSAGE_FAILED,
          ErrorMessage: exception.message,
          ErrorStack: exception.stack,
          ErrorDetails: (exception as any)?.details,
          Timestamp: new Date().toISOString(),
          AcsChatDetails: {
            ThreadId: getState(StateKey.ThreadId),
            RequesterUserId: getState(StateKey.UserId)
          },
          AdditionalParams: {
            activity,
            sendMessageRequest,
            sendMessageOptions
          }
        });
        eventManager.handleError(exception);
      }
    };
}
