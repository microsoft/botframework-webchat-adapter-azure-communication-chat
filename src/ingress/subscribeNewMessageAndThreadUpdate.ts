import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import {
  ChatClient,
  ChatMessage,
  ChatMessageEditedEvent,
  ChatMessageReceivedEvent,
  ChatParticipant,
  ChatThreadClient,
  ChatThreadDeletedEvent,
  ParticipantsAddedEvent,
  ParticipantsRemovedEvent,
  TypingIndicatorReceivedEvent
} from '@azure/communication-chat';
import { LogLevel, Logger } from '../log/Logger';

import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { AdapterEnhancer, ReadyState } from '../types/AdapterTypes';
import { AdapterOptions } from '../types/AdapterTypes';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Constants } from '../Constants';
import EventManager, { CustomEvent } from '../utils/EventManager';
import { IUserUpdate } from '../types/DirectLineTypes';
import { LogEvent } from '../types/LogTypes';
import Observable from 'core-js/features/observable';
import { applySetStateMiddleware } from '../libs';
import createEditedMessageToDirectLineActivityMapper from './mappers/createEditedMessageToDirectLineActivityMapper';
import createErrorMessageToDirectLineActivityMapper from './mappers/createErrorMessageToDirectLineActivityMapper';
import createHistoryMessageToDirectLineActivityMapper, {
  createHistoryAttachmentMessageToDirectLineActivityMapper
} from './mappers/createHistoryMessageToDirectLineActivityMapper';
import createThreadDeleteToDirectLineActivityMapper from './mappers/createThreadDeleteToDirectLineActivityMapper';
import createThreadUpdateToDirectLineActivityMapper from './mappers/createThreadUpdateToDirectLineActivityMapper';
import createTypingMessageToDirectLineActivityMapper from './mappers/createTypingMessageToDirectLineActivityMapper';
import createUserMessageToDirectLineActivityMapper from './mappers/createUserMessageToDirectLineActivityMapper';
import { getIdFromIdentifier } from './ingressHelpers';
import { checkDuplicateMessage } from '../utils/Common';
import { ChatEqualityFields, FileMetadata, IFileManager } from '../types';
import packageInfo from '../../package.json';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';
import { queueAttachmentDownloading } from '../utils/AttachmentProcessor';
import { ConnectionStatus } from '../libs/enhancers/exportDLJSInterface';
import { IMessagePollingHandle } from '../types/MessagePollingTypes';

// Cached offsets for history messages' pagination
let MessageHistoryCurrentPage: any = undefined;
let MessageHistoryIterator: any = undefined;
let MessageHistoryOffset: number | undefined = undefined;
const PagedHistoryMessagesBeforeWebChatInit: ChatMessage[] = [];
const telemetryOptions = {
  requestOptions: {
    customHeaders: {
      'x-ms-useragent': `acs-webchat-adapter-${packageInfo.version} azsdk-js-communication-chat/${packageInfo.dependencies['@azure/communication-chat']}`
    }
  }
};

export default function createSubscribeNewMessageAndThreadUpdateEnhancer(): AdapterEnhancer<
  ACSDirectLineActivity,
  ACSAdapterState
> {
  return applySetStateMiddleware<ACSDirectLineActivity, ACSAdapterState>(
    ({ getState, setState, getReadyState, setReadyState, subscribe }) => {
      const convertMessage = async (event: ChatMessageReceivedEvent): Promise<void | ACSDirectLineActivity> => {
        const activity = await createUserMessageToDirectLineActivityMapper({ getState })()(event);

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_MESSAGE,
          Description: `ACS Adapter: convert normal message`,
          CustomProperties: event,
          MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: event.createdOn.toISOString(),
          ChatThreadId: event.threadId,
          ChatMessageId: event.id
        });

        return activity;
      };

      const convertHistoryMessage = async (message: ChatMessage): Promise<void | ACSDirectLineActivity> => {
        const activity = await createHistoryMessageToDirectLineActivityMapper({ getState })()(message);

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
          Description: 'ACS Adapter: convert history message:',
          CustomProperties: message, // remove content to protect sensitive user info
          MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: message.createdOn.toISOString(),
          ChatMessageId: message.id
        });

        return activity;
      };

      const convertHistoryAttachmentMessage = async (
        message: ChatMessage,
        files: File[]
      ): Promise<void | ACSDirectLineActivity> => {
        const activity = await createHistoryAttachmentMessageToDirectLineActivityMapper({ getState })()({
          message,
          files
        });

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
          Description: 'ACS Adapter: convert attachment history message:',
          CustomProperties: message,
          MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: message.createdOn.toISOString(),
          ChatMessageId: message.id
        });

        return activity;
      };

      const convertEditedMessage = async (event: ChatMessageEditedEvent): Promise<void | ACSDirectLineActivity> => {
        const activity = await createEditedMessageToDirectLineActivityMapper({ getState })()(event);

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_EDITED_MESSAGE,
          Description: 'ACS Adapter: convert edited message',
          CustomProperties: event,
          MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: event.editedOn.toISOString(),
          ChatThreadId: event.threadId,
          ChatMessageId: event.id
        });

        return activity;
      };

      const convertErrorMessage = async (error: Error): Promise<void | ACSDirectLineActivity> => {
        const activity = await createErrorMessageToDirectLineActivityMapper({ getState })()(error);

        Logger.logEvent(LogLevel.ERROR, {
          Event: LogEvent.ACS_SDK_CHATCLIENT_ERROR,
          Description: 'ACS Adapter: convert error message',
          ExceptionDetails: error.message
        });

        return activity;
      };

      const convertTypingMessage = async (
        message: TypingIndicatorReceivedEvent
      ): Promise<void | ACSDirectLineActivity> => {
        const activity = await createTypingMessageToDirectLineActivityMapper({ getState })()(message);

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_TYPING_MESSAGE,
          Description: 'ACS Adapter: convert typing message.',
          MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: message.receivedOn.toISOString(),
          ChatThreadId: message.threadId
        });

        return activity;
      };

      const convertThreadUpdate = async (user: IUserUpdate): Promise<void | ACSDirectLineActivity> => {
        const activity = await createThreadUpdateToDirectLineActivityMapper({ getState })()(user);

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_THREAD_UPDATED,
          Description: 'ACS Adapter: convert thread update'
        });

        return activity;
      };

      const convertThreadDelete = async (event: ChatThreadDeletedEvent): Promise<void | ACSDirectLineActivity> => {
        const activity = await createThreadDeleteToDirectLineActivityMapper({ getState })()(event);

        Logger.logEvent(LogLevel.INFO, {
          Event: LogEvent.ACS_ADAPTER_CONVERT_THREAD_DELETED,
          Description: 'ACS Adapter: convert thread delete',
          ACSRequesterUserId: (event.deletedBy.id as CommunicationUserIdentifier).communicationUserId,
          TimeStamp: event.deletedOn.toISOString(),
          ChatThreadId: event.threadId
        });

        return activity;
      };

      const sendErrorActivity = async (unsubscribed: boolean, next: any, error: Error): Promise<void> => {
        const activity = await convertErrorMessage(error);
        !unsubscribed && next(activity);
      };

      const sendHistoryMessages = async (
        chatThreadClient: ChatThreadClient,
        { unsubscribed }: { unsubscribed: boolean },
        next: any,
        startTime: Date | undefined = undefined,
        pageSizeLimit: number | undefined = undefined
      ): Promise<void> => {
        if (pageSizeLimit === undefined) {
          const pagedAsyncIterableIterator = chatThreadClient.listMessages({
            ...telemetryOptions,
            startTime: startTime
          });
          let nextMessage = await pagedAsyncIterableIterator.next();
          while (!nextMessage.done) {
            const chatMessage = nextMessage.value;
            if (chatMessage.type !== 'text') {
              nextMessage = await pagedAsyncIterableIterator.next();
              continue;
            }

            if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
              Logger.logEvent(LogLevel.INFO, {
                Event: LogEvent.CACHE_PAGED_HISTORY_MESSAGE,
                Description: 'ACS Adapter: Cache paged history message',
                TimeStamp: new Date().toISOString(),
                ChatThreadId: getState(StateKey.ThreadId),
                ACSRequesterUserId: getState(StateKey.UserId),
                ChatMessageId: chatMessage.id
              });
              PagedHistoryMessagesBeforeWebChatInit.push(chatMessage);
              nextMessage = await pagedAsyncIterableIterator.next();
              continue;
            }
            nextMessage = await pagedAsyncIterableIterator.next();
            const activity = await convertHistoryMessage(chatMessage);
            !unsubscribed && next(activity);
          }
        } else {
          let pagedAsyncIterableIterator = MessageHistoryIterator;
          if (pagedAsyncIterableIterator === undefined) {
            pagedAsyncIterableIterator = chatThreadClient
              .listMessages({
                ...telemetryOptions,
                maxPageSize: pageSizeLimit,
                startTime: startTime
              })
              .byPage();
          }

          let i = 0;
          while (i < pageSizeLimit) {
            const cachedPage = MessageHistoryCurrentPage;
            const cachedOffset = MessageHistoryOffset;

            let isCachedPageDone = false;
            if (cachedPage && !isCachedPageDone) {
              for (let j = cachedOffset >= 0 ? cachedOffset : 0; j < cachedPage.value.length; j++) {
                const message = cachedPage.value[j];
                if (message.type !== 'text') {
                  continue;
                }
                if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                  Logger.logEvent(LogLevel.INFO, {
                    Event: LogEvent.CACHE_PAGED_HISTORY_MESSAGE,
                    Description: 'ACS Adapter: Cache paged history message  (with pagesize limit next page)',
                    TimeStamp: new Date().toISOString(),
                    ChatThreadId: getState(StateKey.ThreadId),
                    ACSRequesterUserId: getState(StateKey.UserId),
                    ChatMessageId: message.id
                  });
                  PagedHistoryMessagesBeforeWebChatInit.push(message);
                  i++;
                  continue;
                }
                const activity = await convertHistoryMessage(message);
                !unsubscribed && next(activity);
                i++;
              }
              isCachedPageDone = true;
            }

            const nextMessage = await pagedAsyncIterableIterator.next();
            if (nextMessage.done) {
              break;
            }
            for (let j = 0; j < nextMessage.value.length; j++) {
              if (i >= pageSizeLimit) {
                MessageHistoryIterator = pagedAsyncIterableIterator;
                MessageHistoryOffset = j;
                MessageHistoryCurrentPage = nextMessage;
                break;
              }
              const message = nextMessage.value[j];
              if (message.type !== 'text') {
                continue;
              }

              if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                Logger.logEvent(LogLevel.INFO, {
                  Event: LogEvent.CACHE_PAGED_HISTORY_MESSAGE,
                  Description: 'ACS Adapter: Cache paged history message  (with pagesize limit)',
                  TimeStamp: new Date().toISOString(),
                  ChatThreadId: getState(StateKey.ThreadId),
                  ACSRequesterUserId: getState(StateKey.UserId),
                  ChatMessageId: message.id
                });
                PagedHistoryMessagesBeforeWebChatInit.push(message);
                i++;
                continue;
              }
              const activity = await convertHistoryMessage(message);
              !unsubscribed && next(activity);
              i++;
            }
          }
        }
      };

      const subscribeLoadNextPageEvent = async (
        chatThreadClient: ChatThreadClient,
        { unsubscribed }: { unsubscribed: boolean },
        next: any,
        pageSizeLimit: number | undefined = undefined
      ): Promise<void> => {
        const eventManager: EventManager = getState(StateKey.EventManager);
        eventManager?.addEventListener('acs-adapter-loadnextpage', () => {
          sendHistoryMessages(chatThreadClient, { unsubscribed }, next, undefined, pageSizeLimit);
        });
      };

      const subscribeErrorEvent = async ({ unsubscribed }: { unsubscribed: boolean }, next: any): Promise<void> => {
        const eventManager: EventManager = getState(StateKey.EventManager);
        // The error event listener is implemented to send activity to webchat customized middleware as Egress middleware can't dispatch activity
        eventManager?.addEventListener('error', (errorEvt: CustomEvent) => {
          const errorEvent = errorEvt as CustomEvent;
          sendErrorActivity(unsubscribed, next, errorEvent?.detail?.payload);
        });
      };

      const subscribeLeaveChatEvent = async (
        { unsubscribed }: { unsubscribed: boolean },
        chatThreadClient: ChatThreadClient
      ): Promise<void> => {
        const eventManager: EventManager = getState(StateKey.EventManager);
        eventManager?.addEventListener('acs-adapter-leavechat', () => {
          const chatMemberId: string = getState(StateKey.UserId);
          !unsubscribed &&
            chatThreadClient.removeParticipant(
              {
                communicationUserId: chatMemberId
              },
              telemetryOptions
            );
        });
      };

      const leaveThreadOnWindowClosed = (): void => {
        const eventManager: EventManager = getState(StateKey.EventManager);
        eventManager.addEventListener('beforeunload', () => {
          const token: string = getState(StateKey.Token);
          const endpoint: string = getState(StateKey.EnvironmentUrl);
          const chatThreadId: string = getState(StateKey.ThreadId);
          const chatMemberId: string = getState(StateKey.UserId);
          fetch(
            `${endpoint}/chat/threads/${chatThreadId}/members/${chatMemberId}?api-version=${Constants.API_Version}`,
            {
              keepalive: true,
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              }
            }
          );
        });
      };

      return (next) => async (key: keyof ACSAdapterState, value: any) => {
        if ((key === StateKey.ChatThreadClient && !!value) || (key === StateKey.Reconnect && value)) {
          subscribe(
            new Observable<ACSDirectLineActivity>((subscriber) => {
              const chatClient: ChatClient = getState(StateKey.ChatClient);
              const adapterOptions: AdapterOptions = getState(StateKey.AdapterOptions);
              const messagePollingInstance: IMessagePollingHandle = getState(StateKey.MessagePollingHandleInstance);

              let fileManager: IFileManager = getState(StateKey.FileManager);
              const next = subscriber.next.bind(subscriber);
              let pollingCallbackId: number;
              let rtnDisconnectTime: Date;
              let previousPollingCallTimerFinished = true;
              const pendingFileDownloads: { [key: string]: Map<string, FileMetadata> } = {};

              // TODO: Currently, there is no way to unsubscribe. We are using this flag to fake an "unregisterOnXXX".
              const unsubscribedRef = { unsubscribed: false };

              const chatThreadClient: ChatThreadClient = (
                value === true ? getState(StateKey.ChatThreadClient) : value
              ) as ChatThreadClient;

              const messageCache: Map<string, ChatEqualityFields> = new Map<string, ChatEqualityFields>();
              const newMessagesBeforeWebChatInit: ChatMessageReceivedEvent[] = [];
              const polledHistoryMessagesBeforeWebChatInit: ChatMessage[] = [];
              const initialPollingOptimizationCount = 45;  // shorter polling interval for the initial set count of 45 iterations of 1 sec each

              const pollForMessages = async (
                delaytm: number,
                chatThreadClient: ChatThreadClient,
                startTime?: Date,
                lastMessageReceived?: string,
                iteration = 0
              ): Promise<void> => {
                const pageSize = adapterOptions && adapterOptions.serverPageSizeLimit;
                let pollingException: any;

                // Ready state is closed so skip polling.
                if (getReadyState() === ReadyState.CLOSED) {
                  Logger.logEvent(LogLevel.INFO, {
                    Event: LogEvent.ACS_ADAPTER_POLLING_SKIPPED,
                    Description: 'ACS Adapter: Polling skipped because of thread deletion.',
                    TimeStamp: new Date().toISOString(),
                    ChatThreadId: getState(StateKey.ThreadId),
                    ACSRequesterUserId: getState(StateKey.UserId)
                  });
                  return;
                }

                try {
                  if (!previousPollingCallTimerFinished) {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_ADAPTER_POLLING_SKIPPED,
                      Description: 'ACS Adapter: Polling call issued too soon: skipping',
                      TimeStamp: new Date().toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ACSRequesterUserId: getState(StateKey.UserId)
                    });
                    return;
                  }

                  if (!messagePollingInstance?.getIsPollingEnabled()) {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_ADAPTER_POLLING_SKIPPED,
                      Description: 'ACS Adapter: Polling call disabled from the client: skipping',
                      TimeStamp: new Date().toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ACSRequesterUserId: getState(StateKey.UserId)
                    });
                    return;
                  }

                  Logger.logEvent(LogLevel.INFO, {
                    Event: LogEvent.ACS_SEND_POLLING_REQUEST,
                    Description: 'ACS Adapter: Send polling request',
                    TimeStamp: new Date().toISOString(),
                    ChatThreadId: getState(StateKey.ThreadId),
                    ACSRequesterUserId: getState(StateKey.UserId)
                  });
                  const iterator = chatThreadClient.listMessages({
                    ...telemetryOptions,
                    startTime: startTime,
                    maxPageSize: pageSize
                  });

                  let result = await iterator.next();
                  while (!result.done) {
                    const message: ChatMessage = result.value;
                    // Only process text messages that are new
                    if (message.type === 'text' && message.sequenceId !== lastMessageReceived) {
                      if (!fileManager) {
                        fileManager = getState(StateKey.FileManager);
                      }
                      const isProcessed = checkDuplicateMessage(messageCache, message.id, {
                        content: message.content.message,
                        createdOn: message.createdOn,
                        updatedOn: message.editedOn,
                        fileIds: fileManager?.getFileIds(message.metadata)
                      });
                      if (isProcessed) {
                        Logger.logEvent(LogLevel.INFO, {
                          Event: LogEvent.ACS_SKIP_POLLED_MESSAGE,
                          Description: 'ACS Adapter: Skipping polled message, already processed',
                          TimeStamp: new Date().toISOString(),
                          ChatThreadId: getState(StateKey.ThreadId),
                          ChatMessageId: message.id,
                          ACSRequesterUserId: getState(StateKey.UserId)
                        });
                      } else {
                        Logger.logEvent(LogLevel.INFO, {
                          Event: LogEvent.ACS_PROCESSING_POLLED_MESSAGE,
                          Description: 'ACS Adapter: Processing polled message ' + message.id,
                          TimeStamp: new Date().toISOString(),
                          ChatThreadId: getState(StateKey.ThreadId),
                          ChatMessageId: message.id,
                          ACSRequesterUserId: getState(StateKey.UserId)
                        });
                        if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                          Logger.logEvent(LogLevel.INFO, {
                            Event: LogEvent.CACHE_POLLED_HISTORY_MESSAGE,
                            Description: 'ACS Adapter: Cache polled history message',
                            TimeStamp: new Date().toISOString(),
                            ChatThreadId: getState(StateKey.ThreadId),
                            ACSRequesterUserId: getState(StateKey.UserId),
                            ChatMessageId: message.id
                          });
                          polledHistoryMessagesBeforeWebChatInit.push(message);
                          result = await iterator.next();
                          continue;
                        }

                        messageCache.set(message.id, {
                          content: message.content.message,
                          createdOn: message.createdOn,
                          updatedOn: message.editedOn,
                          fileIds: fileManager?.getFileIds(message.metadata)
                        });
                        const activity = await convertHistoryMessage(message);
                        if (activity) {
                          Logger.logEvent(LogLevel.INFO, {
                            Event: LogEvent.ACS_ADAPTER_POST_ACTIVITY,
                            Description: 'ACS Adapter: Post activity, messageId: ' + activity.messageid,
                            MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
                            TimeStamp: message.createdOn.toISOString(),
                            ChatMessageId: message.id,
                            ACSRequesterUserId: getState(StateKey.UserId)
                          });
                          (activity as any).channelData.fromList = true;
                          next(activity);
                        }
                      }
                    }

                    // Update startTime to only fetch starting from the most recent message onwards
                    if (!startTime || parseInt(message.sequenceId) > parseInt(lastMessageReceived)) {
                      startTime = message.createdOn;
                      lastMessageReceived = message.sequenceId;
                    }

                    result = await iterator.next();
                  }
                } catch (exception) {
                  pollingException = exception;
                  Logger.logEvent(LogLevel.ERROR, {
                    Event: LogEvent.ACS_SDK_CHATCLIENT_ERROR,
                    Description: `ACS Adapter: Polling message fetch failed.`,
                    TimeStamp: new Date().toISOString(),
                    ChatThreadId: getState(StateKey.ThreadId),
                    ExceptionDetails: exception
                  });
                  ErrorEventSubscriber.notifyErrorEvent({
                    StatusCode: exception.response?.status,
                    ErrorType: AdapterErrorEventType.MESSAGE_POLLING_FAILED,
                    ErrorMessage: exception.message,
                    ErrorStack: exception.stack,
                    ErrorDetails: (exception as any)?.details,
                    Timestamp: new Date().toISOString(),
                    AcsChatDetails: {
                      ThreadId: getState(StateKey.ThreadId)
                    }
                  });
                } finally {
                  const statusCode = pollingException?.response?.status;
                  previousPollingCallTimerFinished = false;
                  window.setTimeout(() => (previousPollingCallTimerFinished = true), 15000);

                  // When there is no exception in API call or if exception is present but polling call is still possible then schedule next poll.
                  // We are canceling polling and rescheduling so that accidently any new call to schedule a parallel polling call does not happen.
                  if (!messagePollingInstance?.stopPolling() && (!pollingException || isPollable(statusCode))) {
                    // If there is a poll active, we cancel it and schedule next one after specified timeout.
                    if (pollingCallbackId) {
                      Logger.logEvent(LogLevel.INFO, {
                        Event: LogEvent.ACS_CANCEL_POLLING_CALLBACK,
                        Description: 'ACS Adapter: Canceling polling callback with Id ' + pollingCallbackId,
                        TimeStamp: new Date().toISOString(),
                        ChatThreadId: getState(StateKey.ThreadId),
                        ACSRequesterUserId: getState(StateKey.UserId)
                      });
                      clearTimeout(pollingCallbackId);
                    }
                    pollingCallbackId = window.setTimeout(
                      async () => {
                        if (iteration <= initialPollingOptimizationCount) {
                          previousPollingCallTimerFinished = true;
                        }

                        await pollForMessages(delaytm, chatThreadClient, startTime, lastMessageReceived, iteration + 1);
                      },
                      iteration <= initialPollingOptimizationCount ? 1000 : delaytm
                    );

                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_CREATE_POLLING_CALLBACK,
                      Description: 'ACS Adapter: Created polling callback with Id ' + pollingCallbackId,
                      TimeStamp: new Date().toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ACSRequesterUserId: getState(StateKey.UserId)
                    });
                  } else {
                    if (messagePollingInstance?.stopPolling()) {
                      Logger.logEvent(LogLevel.INFO, {
                        Event: LogEvent.ACS_ADAPTER_POLLING_STOPPED,
                        Description: 'ACS Adapter: Polling call stopped from the client',
                        TimeStamp: new Date().toISOString(),
                        ChatThreadId: getState(StateKey.ThreadId),
                        ACSRequesterUserId: getState(StateKey.UserId)
                      });
                    }
                    // Status code is not pollable as the thread is deleted or user doesn't have permission any more.
                    setReadyState(ReadyState.CLOSED);
                  }
                }
              };

              const isPollable = (statusCode: number): boolean => {
                Logger.logEvent(LogLevel.INFO, {
                  Event: LogEvent.ACS_ADAPTER_POLLING_STATUSCODE,
                  Description: 'ACS Adapter: Polling status code ' + statusCode,
                  TimeStamp: new Date().toISOString(),
                  ChatThreadId: getState(StateKey.ThreadId),
                  ACSRequesterUserId: getState(StateKey.UserId)
                });
                return !(statusCode === 401 || statusCode === 403 || statusCode === 404);
              };

              const reinitializePolling = async (): Promise<void> => {
                if (pollingCallbackId) {
                  Logger.logEvent(LogLevel.INFO, {
                    Event: LogEvent.ACS_CANCEL_POLLING_CALLBACK,
                    Description: 'ACS Adapter: Canceling polling in RTN connected callback Id ' + pollingCallbackId,
                    TimeStamp: new Date().toISOString(),
                    ChatThreadId: getState(StateKey.ThreadId),
                    ACSRequesterUserId: getState(StateKey.UserId)
                  });
                  clearTimeout(pollingCallbackId);
                }
                await pollForMessages(getState(StateKey.PollingInterval), chatThreadClient);
              };

              const subscribeOnlineEvent = async (chatThreadClient: ChatThreadClient): Promise<void> => {
                const eventManager: EventManager = getState(StateKey.EventManager);
                eventManager?.addEventListener('online', async () => {
                  const disconnectDateTime: Date = getState(StateKey.DisconnectUTC);
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.NETWORK_ONLINE,
                    Description: `ACS Adapter: ACS Chat reconnected event since disconnect at ${disconnectDateTime}`,
                    TimeStamp: new Date().toISOString()
                  });
                  if (disconnectDateTime) {
                    setState(StateKey.DisconnectUTC, undefined);
                    if (pollingCallbackId) {
                      Logger.logEvent(LogLevel.INFO, {
                        Event: LogEvent.ACS_CANCEL_POLLING_CALLBACK,
                        Description: 'ACS Adapter: Canceling polling in network connected Id ' + pollingCallbackId,
                        TimeStamp: new Date().toISOString(),
                        ChatThreadId: getState(StateKey.ThreadId),
                        ACSRequesterUserId: getState(StateKey.UserId)
                      });
                      clearTimeout(pollingCallbackId);
                    }

                    // We want to force a polling here immediately after network recovery
                    previousPollingCallTimerFinished = true;
                    await pollForMessages(getState(StateKey.PollingInterval), chatThreadClient, disconnectDateTime);
                  }
                });
              };

              const onRealtimeNotificationConnected = async (): Promise<void> => {
                Logger.logEvent(LogLevel.DEBUG, {
                  Event: LogEvent.ACS_ADAPTER_REALTIME_NOTIFICATION_CONNECTED,
                  Description: `ACS Adapter: Realtime notification connected`,
                  TimeStamp: new Date().toISOString()
                });
                await reinitializePolling();
              };

              const onRealtimeNotificationDisconnected = async (): Promise<void> => {
                rtnDisconnectTime = new Date();
                Logger.logEvent(LogLevel.DEBUG, {
                  Event: LogEvent.ACS_ADAPTER_REALTIME_NOTIFICATION_DISCONNECTED,
                  Description: `ACS Adapter: Realtime notification disconnected`,
                  TimeStamp: rtnDisconnectTime.toISOString()
                });
              };

              const subscribeQueueDownloadAttachmentEvent = async (): Promise<void> => {
                const eventManager: EventManager = getState(StateKey.EventManager);
                eventManager?.addEventListener('queue-attachment-download', async (event: CustomEvent) => {
                  await queueAttachmentDownloading(event, pendingFileDownloads, getState);
                });
              };

              const subscribeAttachmentDownloadedEvent = async (): Promise<void> => {
                //acs-download-attachment
                const eventManager: EventManager = getState(StateKey.EventManager);
                eventManager?.addEventListener('acs-attachment-downloaded', async (event: CustomEvent) => {
                  const { chatMessage, files }: { chatMessage: ChatMessage; files: File[] } = event.detail.payload;
                  Logger.logEvent(LogLevel.INFO, {
                    Event: LogEvent.ACS_ADAPTER_ATTACHMENT_DOWNLOADED,
                    Description: 'ACS Adapter: Attachment downloaded ' + files?.map((file) => file.name).join(','),
                    MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
                    TimeStamp: chatMessage.createdOn.toISOString(),
                    ChatMessageId: chatMessage.id
                  });
                  const activity = (await convertHistoryAttachmentMessage(chatMessage, files)) as ACSDirectLineActivity;
                  if (activity) {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_ADAPTER_POST_FILE_ACTIVITY,
                      Description: 'ACS Adapter: Post file attachment activity, messageId: ' + activity.messageid,
                      MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
                      TimeStamp: chatMessage.createdOn.toISOString(),
                      ChatMessageId: chatMessage.id
                    });
                    next(activity);
                  }
                });
              };

              const subscribeWebChatInitCompleted = async (): Promise<void> => {
                const eventManager: EventManager = getState(StateKey.EventManager);
                eventManager?.addEventListener('webchat-status-connected', async () => {
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.WEBCHAT_STATUS_CONNECTED,
                    Description: `ACS Adapter: Event Webchat connected received`
                  });

                  // Process messages for handling cached paged response messages
                  while (PagedHistoryMessagesBeforeWebChatInit.length > 0) {
                    const historyMessage: ChatMessage = PagedHistoryMessagesBeforeWebChatInit.pop();
                    Logger.logEvent(LogLevel.DEBUG, {
                      Event: LogEvent.PROCESS_CACHED_PAGED_HISTORY_MESSAGE,
                      Description: `ACS Adapter: Process cached history message with id ${historyMessage.id}`,
                      MessageSender: (historyMessage.sender as CommunicationUserIdentifier).communicationUserId,
                      TimeStamp: historyMessage.createdOn.toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ChatMessageId: historyMessage.id
                    });
                    const activity = await convertHistoryMessage(historyMessage);
                    if (activity) {
                      Logger.logEvent(LogLevel.INFO, {
                        Event: LogEvent.ACS_ADAPTER_POST_ACTIVITY,
                        Description: 'ACS Adapter: Post activity, paged history message with Id: ' + activity.messageid,
                        MessageSender: (historyMessage.sender as CommunicationUserIdentifier).communicationUserId,
                        TimeStamp: historyMessage.createdOn.toISOString(),
                        ChatMessageId: historyMessage.id,
                        ACSRequesterUserId: getState(StateKey.UserId)
                      });
                      (activity as any).channelData.fromList = true;
                      next(activity);
                    }
                  }

                  // Process messages for handling cached polled response messages
                  while (polledHistoryMessagesBeforeWebChatInit.length > 0) {
                    const historyMessage: ChatMessage = polledHistoryMessagesBeforeWebChatInit.pop();
                    Logger.logEvent(LogLevel.DEBUG, {
                      Event: LogEvent.PROCESS_CACHED_HISTORY_MESSAGE,
                      Description: `ACS Adapter: Process polled cached history message with Id ${historyMessage.id}`,
                      MessageSender: (historyMessage.sender as CommunicationUserIdentifier).communicationUserId,
                      TimeStamp: historyMessage.createdOn.toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ChatMessageId: historyMessage.id
                    });
                    messageCache.set(historyMessage.id, {
                      content: historyMessage.content.message,
                      createdOn: historyMessage.createdOn,
                      updatedOn: historyMessage.editedOn,
                      fileIds: fileManager?.getFileIds(historyMessage.metadata)
                    });
                    const activity = await convertHistoryMessage(historyMessage);
                    if (activity) {
                      Logger.logEvent(LogLevel.INFO, {
                        Event: LogEvent.ACS_ADAPTER_POST_ACTIVITY,
                        Description: 'ACS Adapter: Post activity, history messageId: ' + activity.messageid,
                        MessageSender: (historyMessage.sender as CommunicationUserIdentifier).communicationUserId,
                        TimeStamp: historyMessage.createdOn.toISOString(),
                        ChatMessageId: historyMessage.id,
                        ACSRequesterUserId: getState(StateKey.UserId)
                      });
                      (activity as any).channelData.fromList = true;
                      next(activity);
                    }
                  }

                  // Process messages for handling new messages
                  while (newMessagesBeforeWebChatInit.length > 0) {
                    const pendingMessageEvent: ChatMessageReceivedEvent = newMessagesBeforeWebChatInit.pop();
                    Logger.logEvent(LogLevel.DEBUG, {
                      Event: LogEvent.PROCESS_CACHED_NEW_MESSAGE,
                      Description: `ACS Adapter: Process cached new message with id ${pendingMessageEvent.id}`,
                      MessageSender: (pendingMessageEvent.sender as CommunicationUserIdentifier).communicationUserId,
                      TimeStamp: pendingMessageEvent.createdOn.toISOString(),
                      ChatThreadId: pendingMessageEvent.threadId,
                      ChatMessageId: pendingMessageEvent.id
                    });
                    await onMessageReceived(pendingMessageEvent);
                  }
                });
              };

              const onMessageReceived = async (event: ChatMessageReceivedEvent): Promise<void> => {
                // If same user has multiple chats only send incoming messages for the current thread
                if (event.threadId === getState(StateKey.ThreadId)) {
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.MESSAGE_RECEIVED,
                    Description: `ACS Adapter: Received a message with id ${event.id}`,
                    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
                    TimeStamp: event.createdOn.toISOString(),
                    ChatThreadId: event.threadId,
                    ChatMessageId: event.id
                  });

                  if (!fileManager) {
                    fileManager = getState(StateKey.FileManager);
                  }

                  if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.CACHE_NEW_MESSAGE,
                      Description: 'ACS Adapter: Cache new message',
                      TimeStamp: new Date().toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ACSRequesterUserId: getState(StateKey.UserId),
                      ChatMessageId: event.id
                    });
                    newMessagesBeforeWebChatInit.push(event);
                    return;
                  }

                  const isProcessed = checkDuplicateMessage(messageCache, event.id, {
                    content: event.message,
                    createdOn: event.createdOn,
                    updatedOn: undefined,
                    fileIds: fileManager?.getFileIds(event.metadata)
                  });
                  if (isProcessed) {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_SKIP_NEW_MESSAGE,
                      Description: 'ACS Adapter: Skipping RTN message, already processed',
                      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
                      TimeStamp: new Date().toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ChatMessageId: event.id
                    });
                    return;
                  } else {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_PROCESSING_NEW_MESSAGE,
                      Description: 'ACS Adapter: Processing new message',
                      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
                      TimeStamp: new Date().toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      ChatMessageId: event.id
                    });
                    messageCache.set(event.id, {
                      content: event.message,
                      createdOn: event.createdOn,
                      fileIds: fileManager?.getFileIds(event.metadata)
                    });
                  }
                  const activity = await convertMessage(event);
                  if (activity) {
                    next(activity);
                  }
                }
              };

              const onTypingMessageReceived = async (event: TypingIndicatorReceivedEvent): Promise<void> => {
                const userId = getIdFromIdentifier(event.sender);
                if (userId === getState(StateKey.UserId)) return;

                if (event.threadId === getState(StateKey.ThreadId)) {
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.TYPING_MESSAGE_RECEIVED,
                    Description: `ACS Adapter: Received a typing message`,
                    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
                    TimeStamp: event.receivedOn.toISOString(),
                    ChatThreadId: event.threadId
                  });
                  const activity = await convertTypingMessage(event);
                  next(activity);
                }
              };

              const onMessageEdited = async (event: ChatMessageEditedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.MESSAGE_EDIT_RECEIVED,
                    Description: `ACS Adapter: Received a message edit event with id ${event.id}`,
                    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
                    TimeStamp: event.editedOn.toISOString(),
                    ChatThreadId: event.threadId,
                    ChatMessageId: event.id
                  });

                  if (!fileManager) {
                    fileManager = getState(StateKey.FileManager);
                  }
                  const isProcessed = checkDuplicateMessage(messageCache, event.id, {
                    content: event.message,
                    createdOn: event.createdOn,
                    updatedOn: event.editedOn,
                    fileIds: fileManager?.getFileIds(event.metadata)
                  });
                  if (isProcessed) {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_SKIP_EDITED_MESSAGE,
                      Description: 'ACS Adapter: Skipping edited RTN message, already processed',
                      TimeStamp: new Date().toISOString(),
                      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
                      ChatThreadId: getState(StateKey.ThreadId),
                      ChatMessageId: event.id
                    });
                    return;
                  } else {
                    Logger.logEvent(LogLevel.INFO, {
                      Event: LogEvent.ACS_PROCESSING_EDITED_MESSAGE,
                      Description: 'ACS Adapter: Processing edited RTN message',
                      TimeStamp: new Date().toISOString(),
                      ChatThreadId: getState(StateKey.ThreadId),
                      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
                      ChatMessageId: event.id
                    });
                    messageCache.set(event.id, {
                      content: event.message,
                      createdOn: event.createdOn,
                      updatedOn: event.editedOn,
                      fileIds: fileManager?.getFileIds(event.metadata)
                    });
                  }

                  const activity = await convertEditedMessage(event);
                  if (activity) {
                    next(activity);
                  }
                }
              };

              const onParticipantsAdded = async (event: ParticipantsAddedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.PARTICIPANT_ADDED_RECEIVED,
                    Description: `ACS Adapter: Received a participant added event`,
                    ACSRequesterUserId: (event.addedBy.id as CommunicationUserIdentifier).communicationUserId,
                    TimeStamp: event.addedOn.toISOString(),
                    ChatThreadId: event.threadId,
                    UserAdded: event.participantsAdded.map(
                      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
                    )
                  });
                  event.participantsAdded.forEach(async (participant: ChatParticipant) => {
                    const userId = getIdFromIdentifier(participant.id);
                    const user: IUserUpdate = {
                      displayName: participant.displayName,
                      tag: 'joined',
                      id: userId
                    };
                    const activity = await convertThreadUpdate(user);
                    next(activity);
                  });
                }
              };

              const onParticipantsRemoved = async (event: ParticipantsRemovedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.PARTICIPANT_REMOVED_RECEIVED,
                    Description: `ACS Adapter: Received a participant removed event`,
                    ACSRequesterUserId: (event.removedBy.id as CommunicationUserIdentifier).communicationUserId,
                    TimeStamp: event.removedOn.toISOString(),
                    ChatThreadId: event.threadId,
                    UserRemoved: event.participantsRemoved.map(
                      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
                    )
                  });
                  event.participantsRemoved.forEach(async (participant: ChatParticipant) => {
                    const userId = getIdFromIdentifier(participant.id);
                    const user: IUserUpdate = {
                      displayName: participant.displayName,
                      tag: 'left',
                      id: userId
                    };
                    const activity = await convertThreadUpdate(user);
                    next(activity);
                  });
                }
              };

              const onChatThreadDeleted = async (event: ChatThreadDeletedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  Logger.logEvent(LogLevel.DEBUG, {
                    Event: LogEvent.THREAD_DELETED_RECEIVED,
                    Description: `ACS Adapter: Received a thread deleted event`,
                    ACSRequesterUserId: (event.deletedBy.id as CommunicationUserIdentifier).communicationUserId,
                    TimeStamp: event.deletedOn.toISOString(),
                    ChatThreadId: event.threadId
                  });
                  const activity = await convertThreadDelete(event);
                  next(activity);
                }
              };

              chatClient.on('chatMessageReceived', onMessageReceived);
              Logger.logEvent(LogLevel.DEBUG, {
                Event: LogEvent.REGISTER_ON_NEW_MESSAGE,
                Description: `ACS Adapter: Registering on new message success`
              });
              chatClient.on('typingIndicatorReceived', onTypingMessageReceived);
              Logger.logEvent(LogLevel.DEBUG, {
                Event: LogEvent.REGISTER_ON_TYPING_INDICATOR,
                Description: `ACS Adapter: Registering on typing indicator success`
              });
              chatClient.on('chatMessageEdited', onMessageEdited);
              Logger.logEvent(LogLevel.DEBUG, {
                Event: LogEvent.REGISTER_ON_MESSAGE_EDIT,
                Description: `ACS Adapter: Registering on message edit success`
              });
              chatClient.on('chatThreadDeleted', onChatThreadDeleted);
              Logger.logEvent(LogLevel.DEBUG, {
                Event: LogEvent.REGISTER_ON_THREAD_DELETED,
                Description: `ACS Adapter: Registering on thread delete success`
              });
              chatClient.on('realTimeNotificationConnected', onRealtimeNotificationConnected);
              Logger.logEvent(LogLevel.DEBUG, {
                Event: LogEvent.REGISTER_ON_REALTIME_NOTIFICATION_CONNECTED,
                Description: `ACS Adapter: Registering on realtime notification connected`
              });
              chatClient.on('realTimeNotificationDisconnected', onRealtimeNotificationDisconnected);
              Logger.logEvent(LogLevel.DEBUG, {
                Event: LogEvent.REGISTER_ON_REALTIME_NOTIFICATION_DISCONNECTED,
                Description: `ACS Adapter: Registering on realtime notification disconnected`
              });

              // notify thread members add/leave notifcation if enableThreadMemberUpdateNotification is set
              if (adapterOptions?.enableThreadMemberUpdateNotification) {
                chatClient.on('participantsAdded', onParticipantsAdded);
                Logger.logEvent(LogLevel.DEBUG, {
                  Event: LogEvent.REGISTER_ON_PARTICIPANT_ADDED,
                  Description: `ACS Adapter: Registering on participant added success`
                });
                chatClient.on('participantsRemoved', onParticipantsRemoved);
                Logger.logEvent(LogLevel.DEBUG, {
                  Event: LogEvent.REGISTER_ON_PARTICIPANT_REMOVED,
                  Description: `ACS Adapter: Registering on participant removed success`
                });
              }

              if (adapterOptions?.enableLeaveThreadOnWindowClosed) {
                // Handle browser close events
                leaveThreadOnWindowClosed();
              }

              // Handle error events
              subscribeErrorEvent(unsubscribedRef, next);

              subscribeQueueDownloadAttachmentEvent();

              subscribeAttachmentDownloadedEvent();

              subscribeWebChatInitCompleted();

              // Remove chat member on this event
              subscribeLeaveChatEvent(unsubscribedRef, chatThreadClient);

              // Get history messages on network reconnect event
              subscribeOnlineEvent(chatThreadClient);

              if (adapterOptions.historyPageSizeLimit) {
                // Synchronizing the history messages for the newly-joined user
                sendHistoryMessages(
                  value as ChatThreadClient,
                  unsubscribedRef,
                  next,
                  undefined,
                  adapterOptions && adapterOptions.historyPageSizeLimit
                );

                subscribeLoadNextPageEvent(
                  value as ChatThreadClient,
                  unsubscribedRef,
                  next,
                  adapterOptions && adapterOptions.historyPageSizeLimit
                );
              } else {
                // Poll for messages until we start receiving notifications
                if (pollingCallbackId) {
                  Logger.logEvent(LogLevel.INFO, {
                    Event: LogEvent.ACS_CANCEL_POLLING_CALLBACK,
                    Description: 'ACS Adapter: Canceling polling, if any, at the start ' + pollingCallbackId,
                    TimeStamp: new Date().toISOString(),
                    ChatThreadId: getState(StateKey.ThreadId),
                    ACSRequesterUserId: getState(StateKey.UserId)
                  });
                  clearTimeout(pollingCallbackId);
                }
                pollForMessages(getState(StateKey.PollingInterval), chatThreadClient);
              }

              return () => {
                unsubscribedRef.unsubscribed = true;
                chatClient.off('chatMessageReceived', onMessageReceived);
                chatClient.off('typingIndicatorReceived', onTypingMessageReceived);
                chatClient.off('chatMessageEdited', onMessageEdited);
                chatClient.off('participantsAdded', onParticipantsAdded);
                chatClient.off('participantsRemoved', onParticipantsRemoved);
                chatClient.off('chatThreadDeleted', onChatThreadDeleted);
              };
            })
          );
        }

        return next(key, value);
      };
    }
  );
}
