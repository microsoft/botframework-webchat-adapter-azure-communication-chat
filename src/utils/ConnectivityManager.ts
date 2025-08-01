import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { delay } from './MessageComparison';
import packageInfo from '../../package.json';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';
import { LoggerUtils } from '../utils/LoggerUtils';

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
          LoggerUtils.logACSReconnectError(`Trying to reconnect failed as ACS Client is in uninitialized state`);
          return false;
        }

        // will throw exception if network is not connected
        await chatThreadClient.getProperties(telemetryOptions);
        return true;
      } catch (exception) {
        retryCount++;
        const statusCode = exception?.response?.status;
        if (retryCount >= maxRetries || (!!statusCode && this.isNotRetryable(statusCode))) {
          LoggerUtils.logACSReconnectError(
            `Trying to reconnect failed with status ${statusCode} after retries ${retryCount}`,
            exception
          );
          ErrorEventSubscriber.notifyErrorEvent({
            StatusCode: exception?.response?.status,
            ErrorType: AdapterErrorEventType.ADAPTER_RECONNECT_FAILED,
            ErrorMessage: exception?.message,
            ErrorStack: exception?.stack,
            ErrorDetails: (exception as any)?.details,
            Timestamp: new Date().toISOString(),
            CorrelationVector: exception?.request?.headers?.get('ms-cv')
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
