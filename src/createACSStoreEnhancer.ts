import { ACSAdapterState, StateKey } from './models/ACSAdapterState';
import { AdapterCreator, AdapterEnhancer, ReadyState } from './types/AdapterTypes';
import { ILogger, Logger } from './log/Logger';
import { SDKInit } from './sdk/SDKInit';
import { ACSDirectLineActivity } from './models/ACSDirectLineActivity';
import { AdapterOptions } from './types/AdapterTypes';
import { ChatClient } from '@azure/communication-chat';
import EventManager from './utils/EventManager';
import { IFileManager } from './types/FileManagerTypes';
import { authConfig } from './sdk/Auth';
import { compose } from 'redux';
import createEgressEnhancer from './egress';
import createIngressEnhancer from './ingress';
import ConnectivityManager from './utils/ConnectivityManager';
import { ErrorEventSubscriber, IErrorEventSubscriber } from './event/ErrorEventNotifier';
import { MessagePollingHandle } from './types/MessagePollingTypes';
import { LoggerUtils } from './utils/LoggerUtils';
import { LogEvent } from './types';

export default function createACSStoreEnhancer(
  token: string,
  id: string,
  threadId: string,
  environmentUrl: string,
  fileManager: IFileManager,
  pollingInterval: number,
  eventSubscriber: IErrorEventSubscriber,
  displayName?: string,
  chatClient?: ChatClient,
  logger?: ILogger,
  adapterOptions?: AdapterOptions
): AdapterEnhancer<ACSDirectLineActivity, ACSAdapterState> {
  return compose(
    (next: AdapterCreator<ACSDirectLineActivity, ACSAdapterState>) => (options: any) => {
      Logger.setInstance(logger);
      ErrorEventSubscriber.setInstance(eventSubscriber);
      const messagePollingHandle = new MessagePollingHandle(adapterOptions.messagePollingHandle);

      const adapter = next(options);
      const eventManager = new EventManager();

      adapter.setState(StateKey.BotId, undefined);
      adapter.setState(StateKey.ChatClient, undefined);
      adapter.setState(StateKey.UserId, undefined);
      adapter.setState(StateKey.AuthConfig, undefined);
      adapter.setState(StateKey.ChatThreadClient, undefined);
      adapter.setState(StateKey.UserDisplayName, undefined);
      adapter.setState(StateKey.ConnectionStatusObserverReady, false);
      adapter.setState(StateKey.DisconnectUTC, undefined);
      adapter.setState(StateKey.EventManager, eventManager);
      adapter.setState(StateKey.AdapterOptions, adapterOptions);
      adapter.setState(StateKey.EnvironmentUrl, undefined);
      adapter.setState(StateKey.ThreadId, undefined);
      adapter.setState(StateKey.Token, undefined);
      adapter.setState(StateKey.Reconnect, false);
      adapter.setState(StateKey.FileManager, undefined);
      adapter.setState(StateKey.PollingInterval, pollingInterval);
      adapter.setState(StateKey.MessagePollingHandleInstance, messagePollingHandle);

      (async function () {
        const sdkClients = await SDKInit(token, id, threadId, environmentUrl, displayName, chatClient);

        //TODO: use a function return value style to avoid global values
        adapter.setState(StateKey.ThreadId, threadId);
        adapter.setState(StateKey.ChatClient, sdkClients.chatClient);
        adapter.setState(StateKey.ChatThreadClient, sdkClients.chatThreadClient);
        adapter.setState(StateKey.UserId, authConfig.id);
        adapter.setState(StateKey.UserDisplayName, displayName);
        adapter.setState(StateKey.AuthConfig, authConfig);
        adapter.setState(StateKey.EnvironmentUrl, environmentUrl);
        adapter.setState(StateKey.Token, token);
        adapter.setState(StateKey.FileManager, fileManager);
        adapter.setReadyState(ReadyState.OPEN);

        eventManager.addEventListener('online', async () => {
          if (!(await ConnectivityManager.isACSConnected(sdkClients.chatClient, sdkClients.chatThreadClient))) {
            eventManager.handleError(new Error('ACS Chat client could not reconnect'));
            return;
          }
          adapter.setReadyState(ReadyState.OPEN);

          LoggerUtils.logSimpleInfoEvent(LogEvent.ACS_SDK_RECONNECT, `ACS Adapter: Reconnect to network.`);
        });
        eventManager.addEventListener('offline', () => {
          adapter.setReadyState(ReadyState.CONNECTING);
          adapter.setState(StateKey.DisconnectUTC, new Date());
        });
      })();

      return adapter;
    },
    createIngressEnhancer(adapterOptions),
    createEgressEnhancer(adapterOptions)
  );
}
