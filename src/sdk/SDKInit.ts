import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { authConfig } from './Auth';
import { config } from './Config';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';
import { LoggerUtils } from '../utils/LoggerUtils';
import { LogEvent } from '../types/LogTypes';

export const SDKInit = async (
  token: string,
  id: string,
  threadId: string,
  environmentUrl: string,
  displayName?: string,
  chatClient?: ChatClient
): Promise<{ chatClient: ChatClient; chatThreadClient: ChatThreadClient }> => {
  const SDK: { chatClient: ChatClient; chatThreadClient: ChatThreadClient } = {
    chatClient: undefined,
    chatThreadClient: undefined
  };
  try {
    if (!token) {
      LoggerUtils.logSDKStartInitError(threadId, id, `ACS Adapter: ACS Adapter start init error. Token is null.`);
      ErrorEventSubscriber.notifyErrorEvent({
        ErrorType: AdapterErrorEventType.ADAPTER_INIT_TOKEN_MISSING_ERROR,
        Timestamp: new Date().toISOString(),
        AcsChatDetails: {
          ThreadId: threadId,
          RequesterUserId: id
        }
      });
    }
    if (!threadId) {
      LoggerUtils.logSDKStartInitError(threadId, id, `ACS Adapter: ACS Adapter start init error. ThreadId is null.`);
      ErrorEventSubscriber.notifyErrorEvent({
        ErrorType: AdapterErrorEventType.ADAPTER_INIT_THREAD_ID_MISSING_ERROR,
        Timestamp: new Date().toISOString(),
        AcsChatDetails: {
          RequesterUserId: id
        }
      });
    }

    authConfig.id = id;
    authConfig.environmentUrl = environmentUrl;
    authConfig.token = token;

    config.displayName = displayName ?? '';

    LoggerUtils.logSDKStartInit(threadId, id);

    const userAccessTokenCredentialNew = new AzureCommunicationTokenCredential(token);

    SDK.chatClient = chatClient ?? new ChatClient(authConfig.environmentUrl, userAccessTokenCredentialNew);

    SDK.chatThreadClient = SDK.chatClient.getChatThreadClient(threadId);

    if (!SDK.chatThreadClient) {
      LoggerUtils.logSimpleErrorEvent(LogEvent.ACS_SDK_JOINTHREAD_ERROR, `ACS Adapter: failed to join the thread.`);
    }

    await SDK.chatClient.startRealtimeNotifications();

    return SDK;
  } catch (exception) {
    LoggerUtils.logSDKStartInitError(threadId, id, `ACS Adapter: ACS Adapter start init error.`, exception);
    ErrorEventSubscriber.notifyErrorEvent({
      ErrorType: AdapterErrorEventType.ADAPTER_INIT_EXCEPTION,
      ErrorMessage: exception.message,
      ErrorStack: exception.stack,
      ErrorDetails: (exception as any)?.details,
      Timestamp: new Date().toISOString(),
      AcsChatDetails: {
        RequesterUserId: id,
        ThreadId: id
      },
      CorrelationVector: exception?.request?.headers?.get('ms-cv')
    });
  }
};
