import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { ActivityType } from '../types/DirectLineTypes';
import { ChatThreadClient, SendTypingNotificationOptions } from '@azure/communication-chat';
import { EgressMiddleware } from '../libs/applyEgressMiddleware';
import { AdapterOptions } from '..';
import packageInfo from '../../package.json';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';
import { LoggerUtils } from '../utils/LoggerUtils';

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
        LoggerUtils.logEgressTypingFailed(getState, activity.timestamp, errorMessage);
        throw new Error(errorMessage);
      }

      const options: SendTypingNotificationOptions = adapterOptions?.enableSenderDisplayNameInTypingNotification
        ? {
            ...telemetryOptions,
            senderDisplayName: getState(StateKey.UserDisplayName)
          }
        : { ...telemetryOptions };
      try {
        LoggerUtils.logEgressTypingSendingRequest(getState, activity.timestamp);
        await chatThreadClient.sendTypingNotification(options);
        LoggerUtils.logIngressTypingSuccess(getState, activity.timestamp);
      } catch (exception) {
        const httpRequest = exception?.request;
        LoggerUtils.logEgressTypingSendFailed(getState, activity, options, exception);
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
            httpRequest
          },
          CorrelationVector: exception?.request?.headers?.get('ms-cv')
        });
      }
    };
}
