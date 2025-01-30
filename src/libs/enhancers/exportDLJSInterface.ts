// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/external.d.ts" />

import {
  Adapter,
  AdapterCreator,
  AdapterEnhancer,
  AdapterOptions,
  AdapterState,
  ReadyState
} from '../../types/AdapterTypes';

import Observable, { Observer } from 'core-js/features/observable';

import { IDirectLineActivity } from '../../types/DirectLineTypes';
import shareObservable from '../utils/shareObservable';
import { StateKey } from '../../models/ACSAdapterState';
import EventManager from '../../utils/EventManager';
import { Logger, LogLevel } from '../../log/Logger';
import { LogEvent } from '../../types/LogTypes';

export enum ConnectionStatus {
  Uninitialized = 0,
  Connecting = 1,
  Connected = 2,
  FailedToConnect = 4
}

export interface IDirectLineJS {
  activity$: Observable<IDirectLineActivity>;
  connectionStatus$: Observable<ConnectionStatus>;
  end: () => void;
  postActivity: (activity: IDirectLineActivity) => Observable<string>;
}

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
}

export default function exportDLJSInterface<TAdapterState extends AdapterState>(): AdapterEnhancer<
  IDirectLineActivity,
  TAdapterState
> {
  return (next: AdapterCreator<IDirectLineActivity, TAdapterState>) =>
    (options: AdapterOptions): Adapter<IDirectLineActivity, TAdapterState> & IDirectLineJS => {
      const adapter = next(options);
      let connectionStatusObserver: Observer<ConnectionStatus>;

      adapter.setState(StateKey.WebChatStatus, ConnectionStatus.Uninitialized);
      adapter.addEventListener('open', async () => {
        const eventManager: EventManager = adapter.getState(StateKey.EventManager);

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ADAPTER_STATE_UPDATE,
          Description: `Adapter state has been changed to open`
        });

        if (!connectionStatusObserver) {
          let waitTime = 5;
          const connectionStatusObserverWaitTime = options?.webChatInitTimeout ? options?.webChatInitTimeout : 2000;
          while (!connectionStatusObserver && waitTime < connectionStatusObserverWaitTime) {
            await timeout(waitTime);
            waitTime = waitTime * 2;
          }
          if (!connectionStatusObserver) {
            Logger.logEvent(LogLevel.ERROR, {
              Event: LogEvent.WEBCHAT_SUBSCRIPTION_TIMEOUT,
              Description: `WebChat couldn't subscribe to connection status changes in ${connectionStatusObserverWaitTime} ms`
            });
            eventManager.handleError(new Error('WebChat subscription timeout to connection status changes'));
            adapter.setState(StateKey.WebChatStatus, ConnectionStatus.FailedToConnect);
          } else {
            Logger.logEvent(LogLevel.INFO, {
              Event: LogEvent.WEBCHAT_SUBSCRIPTION_SUCCESS,
              Description: `WebChat subscribed to connection status changes in ${waitTime} ms`
            });
            connectionStatusObserver.next(ConnectionStatus.Connected);
            adapter.setState(StateKey.WebChatStatus, ConnectionStatus.Connected);
            eventManager.raiseCustomEvent('webchat-status-connected', {});
          }
        } else {
          Logger.logEvent(LogLevel.INFO, {
            Event: LogEvent.WEBCHAT_SUBSCRIPTION_SUCCESS,
            Description: `WebChat already connected`
          });
          connectionStatusObserver.next(ConnectionStatus.Connected);
          adapter.setState(StateKey.WebChatStatus, ConnectionStatus.Connected);
          eventManager.raiseCustomEvent('webchat-status-connected', {});
        }
      });

      adapter.addEventListener('error', () => {
        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ADAPTER_STATE_UPDATE,
          Description: `Adapter state has been changed to error`
        });
        const connectionStatus =
          adapter.getReadyState() === ReadyState.CLOSED
            ? ConnectionStatus.FailedToConnect
            : ConnectionStatus.Connecting;
        connectionStatusObserver.next(connectionStatus);
        adapter.setState(StateKey.WebChatStatus, connectionStatus);
      });

      let firstConnect = true;

      return {
        ...adapter,

        activity$: shareObservable(
          new Observable((observer) => {
            const abortController = new AbortController();

            (async function () {
              try {
                for await (const activity of adapter.activities({ signal: abortController.signal })) {
                  observer.next(activity);
                }

                observer.complete();
              } catch (error) {
                observer.error(error);
              }
            })();

            if (!firstConnect) {
              adapter.setReadyState(ReadyState.CONNECTING);
              adapter.setReadyState(ReadyState.OPEN);
              adapter.setState(StateKey.Reconnect, true);
            } else {
              firstConnect = false;
            }

            return () => {
              abortController.abort();
            };
          })
        ),

        connectionStatus$: shareObservable(
          new Observable((observer) => {
            observer.next(ConnectionStatus.Uninitialized);
            observer.next(ConnectionStatus.Connecting);

            connectionStatusObserver = observer;

            return () => {
              connectionStatusObserver = undefined;
            };
          })
        ),

        end: () => {
          adapter.close();
        },

        postActivity(activity: IDirectLineActivity) {
          return new Observable((observer) => {
            (async function () {
              await adapter.egress(activity, {
                progress: ({ id }: { id?: string }) => id && observer.next(id)
              });
              //await adapter.ingress({...activity, id: uniqueId()}); //No need to call ingress as IC3 is providing echo back. If we need this for DL, a new class for IC3 should be created
              observer.complete();
            })();
          });
        }
      };
    };
}
