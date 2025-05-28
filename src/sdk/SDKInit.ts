import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { Logger, LogLevel } from '../log/Logger';
import { LogEvent } from '../types/LogTypes';
import { authConfig } from './Auth';
import { config } from './Config';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';

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
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_SDK_START_INIT_ERROR,
        ChatThreadId: threadId,
        ACSRequesterUserId: id,
        Description: `ACS Adapter: ACS Adapter start init error. Token is null.`
      });
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
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_SDK_START_INIT_ERROR,
        ChatThreadId: threadId,
        ACSRequesterUserId: id,
        Description: `ACS Adapter: ACS Adapter start init error. ThreadId is null.`
      });
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

    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_SDK_START_INIT,
      ChatThreadId: threadId,
      ACSRequesterUserId: id,
      Description: `ACS Adapter: ACS Adapter start init.`
    });

    const userAccessTokenCredentialNew = new AzureCommunicationTokenCredential(token);

    SDK.chatClient = chatClient ?? new ChatClient(authConfig.environmentUrl, userAccessTokenCredentialNew);

    if (!SDK.chatClient) {
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_SDK_CHATCLIENT_ERROR,
        Description: `ACS Adapter: ACS ChatClient failed to init.`
      });
    }

    SDK.chatThreadClient = SDK.chatClient.getChatThreadClient(threadId);

    if (!SDK.chatThreadClient) {
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_SDK_JOINTHREAD_ERROR,
        Description: `ACS Adapter: failed to join the thread.`
      });
    }

    await SDK.chatClient.startRealtimeNotifications();

    return SDK;
  } catch (exception) {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_SDK_START_INIT_ERROR,
      ChatThreadId: threadId,
      ACSRequesterUserId: id,
      Description: `ACS Adapter: ACS Adapter start init error.`,
      ExceptionDetails: exception
    });
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
