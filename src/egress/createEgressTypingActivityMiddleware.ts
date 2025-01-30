import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import { LogLevel, Logger } from '../log/Logger';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { ActivityType } from '../types/DirectLineTypes';
import { ChatThreadClient, SendTypingNotificationOptions } from '@azure/communication-chat';
import { EgressMiddleware } from '../libs/applyEgressMiddleware';
import { LogEvent } from '../types/LogTypes';
import { AdapterOptions } from '..';
import packageInfo from '../../package.json';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';

const telemetryOptions = {
  requestOptions: {
    customHeaders: {
      'x-ms-useragent': `acs-webchat-adapter-${packageInfo.version} azsdk-js-communication-chat/${packageInfo.dependencies['@azure/communication-chat']}`
    }
  }
};

export default function createEgressTypingActivityMiddleware(): EgressMiddleware<
  ACSDirectLineActivity,
  ACSAdapterState
> {
  return ({ getState }) =>
    (next) =>
    async (activity: ACSDirectLineActivity) => {
      if (activity.type !== ActivityType.Typing) {
        return next(activity);
      }

      const chatThreadClient: ChatThreadClient = getState(StateKey.ChatThreadClient);
      const adapterOptions: AdapterOptions = getState(StateKey.AdapterOptions);

      if (!chatThreadClient) {
        const errorMessage = 'ACS Adapter: Failed to egress typing activity with an undefined chatThreadClient.';
        Logger.logEvent(LogLevel.ERROR, {
          Event: LogEvent.ACS_ADAPTER_EGRESS_TYPING_FAILED,
          Description: errorMessage,
          ACSRequesterUserId: getState(StateKey.UserId),
          TimeStamp: activity.timestamp,
          ChatThreadId: getState(StateKey.ThreadId)
        });
        throw new Error(errorMessage);
      }

      const options: SendTypingNotificationOptions = adapterOptions?.enableSenderDisplayNameInTypingNotification
        ? {
            ...telemetryOptions,
            senderDisplayName: getState(StateKey.UserDisplayName)
          }
        : { ...telemetryOptions };
      try {
        Logger.logEvent(LogLevel.DEBUG, {
          Event: LogEvent.ACS_ADAPTER_EGRESS_TYPING_SENDING_REQUEST,
          Description: 'ACS Adapter: Request sending a typing indication',
          ACSRequesterUserId: getState(StateKey.UserId),
          TimeStamp: activity.timestamp,
          ChatThreadId: getState(StateKey.ThreadId)
        });
        await chatThreadClient.sendTypingNotification(options);
        Logger.logEvent(LogLevel.DEBUG, {
          Event: LogEvent.ACS_ADAPTER_INGRESS_TYPING_SUCCESS,
          Description: 'ACS Adapter: Successfully sent a typing indication',
          ACSRequesterUserId: getState(StateKey.UserId),
          TimeStamp: activity.timestamp,
          ChatThreadId: getState(StateKey.ThreadId)
        });
      } catch (exception) {
        Logger.logEvent(LogLevel.ERROR, {
          Event: LogEvent.ACS_ADAPTER_SEND_MESSAGE_FAILED,
          Description: `Send message failed.`,
          CustomProperties: options,
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
            activity
          }
        });
      }
    };
}
