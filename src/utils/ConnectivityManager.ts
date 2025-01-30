import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { Logger, LogLevel } from '../log/Logger';
import { LogEvent } from '../types/LogTypes';
import { delay } from './Common';
import packageInfo from '../../package.json';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';

const telemetryOptions = {
  requestOptions: {
    customHeaders: {
      'x-ms-useragent': `acs-webchat-adapter-${packageInfo.version}  azsdk-js-communication-chat/${packageInfo.dependencies['@azure/communication-chat']}`
    }
  }
};

export default class ConnectivityManager {
  // check if ACS is connected
  // this functions is called only after SDKInit is done
  public static async isACSConnected(chatClient: ChatClient, chatThreadClient: ChatThreadClient): Promise<boolean> {
    const initialRetryInterval = 1000;
    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        if (!chatThreadClient || !chatClient) {
          Logger.logEvent(LogLevel.ERROR, {
            Event: LogEvent.ACS_SDK_CHATCLIENT_RECONNECT_ERROR,
            Description: `Trying to reconnect failed as ACS Client is in uninitialized state`
          });
          return false;
        }

        // will throw exception if network is not connected
        await chatThreadClient.getProperties(telemetryOptions);
        return true;
      } catch (exception) {
        retryCount++;
        const statusCode = exception?.response?.status;
        if (retryCount >= maxRetries || (!!statusCode && this.isNotRetryable(statusCode))) {
          Logger.logEvent(LogLevel.ERROR, {
            Event: LogEvent.ACS_SDK_CHATCLIENT_RECONNECT_ERROR,
            Description: `Trying to reconnect failed with status ${statusCode} after retries ${retryCount}`,
            ExceptionDetails: exception
          });

          ErrorEventSubscriber.notifyErrorEvent({
            StatusCode: exception?.response?.status,
            ErrorType: AdapterErrorEventType.ADAPTER_RECONNECT_FAILED,
            ErrorMessage: exception?.message,
            ErrorStack: exception?.stack,
            ErrorDetails: (exception as any)?.details,
            Timestamp: new Date().toISOString()
          });
          return false;
        }
        await delay(initialRetryInterval * Math.pow(2, retryCount));
      }
    }
    return false;
  }

  private static isNotRetryable(statusCode: number): boolean {
    return statusCode === 401 || statusCode === 403 || statusCode === 404;
  }
}
