import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import {
  ChatClient,
  ChatMessage,
  ChatMessageEditedEvent,
  ChatMessageReceivedEvent,
  ChatThreadClient,
  ChatThreadDeletedEvent,
  ParticipantsAddedEvent,
  ParticipantsRemovedEvent,
  TypingIndicatorReceivedEvent,
  StreamingChatMessageChunkReceivedEvent,
  ChatMessageDeletedEvent
} from '@azure/communication-chat';
import { LogLevel, Logger } from '../log/Logger';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { AdapterEnhancer, ReadyState } from '../types/AdapterTypes';
import { AdapterOptions } from '../types/AdapterTypes';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Constants } from '../Constants';
import EventManager, { CustomEvent } from '../utils/EventManager';
import { LogEvent } from '../types/LogTypes';
import Observable from 'core-js/features/observable';
import { applySetStateMiddleware } from '../libs';
import createErrorMessageToDirectLineActivityMapper from './mappers/createErrorMessageToDirectLineActivityMapper';
import { createHistoryAttachmentMessageToDirectLineActivityMapper } from './mappers/createHistoryMessageToDirectLineActivityMapper';
import createThreadDeleteToDirectLineActivityMapper from './mappers/createThreadDeleteToDirectLineActivityMapper';
import createTypingMessageToDirectLineActivityMapper from './mappers/createTypingMessageToDirectLineActivityMapper';
import createUserMessageToDirectLineActivityMapper from './mappers/createUserMessageToDirectLineActivityMapper';
import {
  getIdFromIdentifier,
  isDuplicateMessage,
  cacheParticipantAddedEventIfNeeded,
  cacheTextMessageIfNeeded,
  updateMessageCacheWithMessage,
  cacheParticipantRemovedEventIfNeeded
} from './ingressHelpers';
import { ChatEqualityFields, FileMetadata, IFileManager } from '../types';
import packageInfo from '../../package.json';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';
import { queueAttachmentDownloading } from '../utils/AttachmentProcessor';
import { ConnectionStatus } from '../libs/enhancers/exportDLJSInterface';
import { IMessagePollingHandle } from '../types/MessagePollingTypes';
import { LoggerUtils } from '../utils/LoggerUtils';
import { convertStreamingMessageChunkEvent } from './eventconverters/StreamingMessageChunkReceivedEventConverter';
import {
  convertAndProcessHistoryMessageByType,
  processHistoryMessage
} from './eventconverters/HistoryMessageConverter';
import { processParticipants } from './eventconverters/ParticipantsConverter';
import {
  isChatMessageTypeSupported,
  isParticipantsAddedEvent,
  isParticipantsRemovedEvent
} from '../utils/MessageUtils';
import { convertDeletedMessageEvent, convertEditedMessageEvent } from './eventconverters/MessageConverter';

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

        LoggerUtils.logConvertMessage(event);

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

        LoggerUtils.logConvertHistoryMessage(message, 'ACS Adapter: convert attachment history message');
        return activity;
      };

      const convertErrorMessage = async (error: Error): Promise<void | ACSDirectLineActivity> => {
        const activity = await createErrorMessageToDirectLineActivityMapper({ getState })()(error);
        LoggerUtils.logSDKChatClientError(error);
        return activity;
      };

      const convertTypingMessage = async (
        message: TypingIndicatorReceivedEvent
      ): Promise<void | ACSDirectLineActivity> => {
        const activity = await createTypingMessageToDirectLineActivityMapper({ getState })()(message);

        LoggerUtils.logConvertTypingMessage(message);

        return activity;
      };

      const convertThreadDelete = async (event: ChatThreadDeletedEvent): Promise<void | ACSDirectLineActivity> => {
        const activity = await createThreadDeleteToDirectLineActivityMapper({ getState })()(event);

        LoggerUtils.logConvertThreadDelete(event);

        return activity;
      };

      const sendErrorActivity = async (unsubscribed: boolean, next: any, error: Error): Promise<void> => {
        const activity = await convertErrorMessage(error);
        if (!unsubscribed) {
          next(activity);
        }
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
            const chatMessage: ChatMessage = nextMessage.value;
            const logDescription = 'ACS Adapter: Cache paged history message';
            processHistoryMessage(
              PagedHistoryMessagesBeforeWebChatInit,
              chatMessage,
              logDescription,
              unsubscribed,
              getState,
              next
            );
            // update list iterator
            nextMessage = await pagedAsyncIterableIterator.next();
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

          const logDescription = 'ACS Adapter: Cache paged history message  (with pagesize limit)';
          let i = 0;
          while (i < pageSizeLimit) {
            const cachedPage = MessageHistoryCurrentPage;
            const cachedOffset = MessageHistoryOffset;

            if (cachedPage) {
              for (let j = cachedOffset >= 0 ? cachedOffset : 0; j < cachedPage.value.length; j++) {
                const message = cachedPage.value[j];

                const wasMessageProcessed = processHistoryMessage(
                  PagedHistoryMessagesBeforeWebChatInit,
                  message,
                  logDescription,
                  unsubscribed,
                  getState,
                  next
                );
                if (wasMessageProcessed) {
                  // If message was processed, count this message toward page limit
                  i++;
                }
              }
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
              const wasMessageProcessed = processHistoryMessage(
                PagedHistoryMessagesBeforeWebChatInit,
                message,
                logDescription,
                unsubscribed,
                getState,
                next
              );
              if (wasMessageProcessed) {
                // If message was processed, count this message toward page limit
                i++;
              }
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
          if (!unsubscribed) {
            chatThreadClient.removeParticipant(
              {
                communicationUserId: chatMemberId
              },
              telemetryOptions
            );
          }
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
              const newMessagesBeforeWebChatInit: (
                | ChatMessageReceivedEvent
                | ParticipantsAddedEvent
                | ParticipantsRemovedEvent
              )[] = [];
              const polledHistoryMessagesBeforeWebChatInit: ChatMessage[] = [];
              const initialPollingOptimizationCount = 45; // shorter polling interval for the initial set count of 45 iterations of 1 sec each

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
                  LoggerUtils.logAdapterPollingSkipped(
                    getState,
                    'ACS Adapter: Polling skipped because of thread deletion.'
                  );
                  return;
                }

                try {
                  if (!previousPollingCallTimerFinished) {
                    LoggerUtils.logAdapterPollingSkipped(
                      getState,
                      'ACS Adapter: Polling call issued too soon: skipping'
                    );
                    return;
                  }

                  if (!messagePollingInstance?.getIsPollingEnabled()) {
                    LoggerUtils.logAdapterPollingSkipped(
                      getState,
                      'ACS Adapter: Polling call disabled from the client: skipping'
                    );
                    return;
                  }

                  LoggerUtils.logSendPollingRequest(getState);
                  const iterator = chatThreadClient.listMessages({
                    ...telemetryOptions,
                    startTime: startTime,
                    maxPageSize: pageSize
                  });

                  let result = await iterator.next();
                  while (!result.done) {
                    const message: ChatMessage = result.value;
                    // Only process text and participants messages that are new
                    // TODO: refactor to use message.sequenceId > lastMessageReceived if it doesn't break the functionality
                    if (isChatMessageTypeSupported(message.type) && message.sequenceId !== lastMessageReceived) {
                      if (!fileManager) {
                        fileManager = getState(StateKey.FileManager);
                      }
                      const isProcessed = isDuplicateMessage(message, messageCache, fileManager);
                      if (isProcessed) {
                        LoggerUtils.logSkipProcessedPolledMessage(getState, message.id);
                      } else {
                        LoggerUtils.logProcessingPolledMessage(getState, message.id);
                        if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                          LoggerUtils.logCachePolledHistoryMessage(getState, message.id);
                          polledHistoryMessagesBeforeWebChatInit.push(message);
                          result = await iterator.next();
                          continue;
                        }

                        updateMessageCacheWithMessage(message, messageCache, fileManager);

                        const logDescription = 'ACS Adapter: Post activity, messageId: ';
                        convertAndProcessHistoryMessageByType(message, getState, next, logDescription);
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
                  LoggerUtils.logPollingMessageFetchFailed(getState, exception);
                  ErrorEventSubscriber.notifyErrorEvent({
                    StatusCode: exception.response?.status,
                    ErrorType: AdapterErrorEventType.MESSAGE_POLLING_FAILED,
                    ErrorMessage: exception.message,
                    ErrorStack: exception.stack,
                    ErrorDetails: (exception as any)?.details,
                    Timestamp: new Date().toISOString(),
                    AcsChatDetails: {
                      ThreadId: getState(StateKey.ThreadId)
                    },
                    CorrelationVector: exception?.request?.headers?.get('ms-cv')
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
                      LoggerUtils.logCancelPollingCallback(
                        getState,
                        'ACS Adapter: Canceling polling callback with Id ' + pollingCallbackId
                      );
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

                    LoggerUtils.logPollingCallbackCreated(getState, pollingCallbackId);
                  } else {
                    if (messagePollingInstance?.stopPolling()) {
                      LoggerUtils.logPollingCallStopped(getState);
                    }
                    // Status code is not pollable as the thread is deleted or user doesn't have permission any more.
                    setReadyState(ReadyState.CLOSED);
                  }
                }
              };

              const isPollable = (statusCode: number): boolean => {
                LoggerUtils.logPollingStatusCode(getState, statusCode);
                return !(statusCode === 401 || statusCode === 403 || statusCode === 404);
              };

              const reinitializePolling = async (): Promise<void> => {
                if (pollingCallbackId) {
                  LoggerUtils.logCancelPollingCallback(
                    getState,
                    'ACS Adapter: Canceling polling in RTN connected callback Id ' + pollingCallbackId
                  );
                  clearTimeout(pollingCallbackId);
                }
                await pollForMessages(getState(StateKey.PollingInterval), chatThreadClient);
              };

              const subscribeOnlineEvent = async (chatThreadClient: ChatThreadClient): Promise<void> => {
                const eventManager: EventManager = getState(StateKey.EventManager);
                eventManager?.addEventListener('online', async () => {
                  const disconnectDateTime: Date = getState(StateKey.DisconnectUTC);
                  LoggerUtils.logNetworkOnline(disconnectDateTime);
                  if (disconnectDateTime) {
                    setState(StateKey.DisconnectUTC, undefined);
                    if (pollingCallbackId) {
                      LoggerUtils.logCancelPollingCallback(
                        getState,
                        'ACS Adapter: Canceling polling in network connected Id ' + pollingCallbackId
                      );
                      clearTimeout(pollingCallbackId);
                    }

                    // We want to force a polling here immediately after network recovery
                    previousPollingCallTimerFinished = true;
                    await pollForMessages(getState(StateKey.PollingInterval), chatThreadClient, disconnectDateTime);
                  }
                });
              };

              const onRealtimeNotificationConnected = async (): Promise<void> => {
                LoggerUtils.logRTNStateChanged(
                  LogEvent.ACS_ADAPTER_REALTIME_NOTIFICATION_CONNECTED,
                  `ACS Adapter: Realtime notification connected`
                );
                await reinitializePolling();
              };

              const onRealtimeNotificationDisconnected = async (): Promise<void> => {
                LoggerUtils.logRTNStateChanged(
                  LogEvent.ACS_ADAPTER_REALTIME_NOTIFICATION_DISCONNECTED,
                  `ACS Adapter: Realtime notification disconnected`
                );
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
                  LoggerUtils.logAttachmentDownloaded(chatMessage, files);
                  const activity = (await convertHistoryAttachmentMessage(chatMessage, files)) as ACSDirectLineActivity;
                  if (activity) {
                    LoggerUtils.logPostFileActivity(chatMessage, activity);
                    next(activity);
                  }
                });
              };

              const subscribeWebChatInitCompleted = async (): Promise<void> => {
                const eventManager: EventManager = getState(StateKey.EventManager);
                eventManager?.addEventListener('webchat-status-connected', async () => {
                  LoggerUtils.logWebChatConnectedEvent();
                  // Process messages for handling cached paged response messages
                  while (PagedHistoryMessagesBeforeWebChatInit.length > 0) {
                    const historyMessage: ChatMessage = PagedHistoryMessagesBeforeWebChatInit.pop();
                    LoggerUtils.logProcessCachedPagedHistoryMessage(getState, historyMessage);
                    const logDescription = 'ACS Adapter: Post activity, paged history message with Id: ';
                    convertAndProcessHistoryMessageByType(historyMessage, getState, next, logDescription);
                  }
                  // Process messages for handling cached polled response messages
                  while (polledHistoryMessagesBeforeWebChatInit.length > 0) {
                    const historyMessage: ChatMessage = polledHistoryMessagesBeforeWebChatInit.pop();
                    LoggerUtils.logProcessPolledCachedHistoryMessage(getState, historyMessage);
                    updateMessageCacheWithMessage(historyMessage, messageCache, fileManager);

                    const logDescription = 'ACS Adapter: Post activity, history messageId: ' + historyMessage.id;
                    convertAndProcessHistoryMessageByType(historyMessage, getState, next, logDescription);
                  }

                  // Process messages for handling new messages
                  while (newMessagesBeforeWebChatInit.length > 0) {
                    const pendingMessageEvent = newMessagesBeforeWebChatInit.pop();
                    if (isParticipantsAddedEvent(pendingMessageEvent)) {
                      LoggerUtils.logProcessCachedParticipantsAddedEvent(pendingMessageEvent);
                      processParticipants(
                        pendingMessageEvent.participantsAdded,
                        Constants.PARTICIPANT_JOINED,
                        getState,
                        next
                      );
                    } else if (isParticipantsRemovedEvent(pendingMessageEvent)) {
                      LoggerUtils.logProcessCachedParticipantsRemovedEvent(pendingMessageEvent);
                      processParticipants(
                        pendingMessageEvent.participantsRemoved,
                        Constants.PARTICIPANT_LEFT,
                        getState,
                        next
                      );
                    } else if ('message' in pendingMessageEvent) {
                      LoggerUtils.logProcessCachedTextMessage(pendingMessageEvent);
                      await onMessageReceived(pendingMessageEvent);
                    }
                  }
                });
              };

              const onMessageReceived = async (event: ChatMessageReceivedEvent): Promise<void> => {
                // If same user has multiple chats only send incoming messages for the current thread
                if (event.threadId === getState(StateKey.ThreadId)) {
                  LoggerUtils.logMessageReceived(event);

                  if (!fileManager) {
                    fileManager = getState(StateKey.FileManager);
                  }

                  if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                    LoggerUtils.logCacheNewMessage(event, getState);
                    newMessagesBeforeWebChatInit.push(event);
                    return;
                  }

                  const isProcessed = cacheTextMessageIfNeeded(
                    messageCache,
                    event,
                    getState,
                    fileManager,
                    LogEvent.ACS_PROCESSING_NEW_MESSAGE
                  );

                  if (isProcessed) {
                    LoggerUtils.logSkipNewMessage(event, getState);
                    return;
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
                  LoggerUtils.logTypingMessageReceived(event);
                  const activity = await convertTypingMessage(event);
                  next(activity);
                }
              };

              const onMessageDeleted = async (event: ChatMessageDeletedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  LoggerUtils.logMessageDeletedEventReceived(event);

                  const messageToCheck = { ...event, message: '' };
                  const isProcessed = cacheTextMessageIfNeeded(
                    messageCache,
                    messageToCheck,
                    getState,
                    fileManager,
                    LogEvent.ACS_PROCESSING_DELETED_MESSAGE
                  );
                  if (isProcessed) {
                    LoggerUtils.logSkipProcessedDeletedMessageEvent(event, getState);
                    return;
                  }

                  const activity = await convertDeletedMessageEvent(event, getState);
                  if (activity) {
                    next(activity);
                  }
                }
              };

              const onMessageEdited = async (event: ChatMessageEditedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  LoggerUtils.logMessageEditEventReceived(event);

                  if (!fileManager) {
                    fileManager = getState(StateKey.FileManager);
                  }
                  const isProcessed = cacheTextMessageIfNeeded(
                    messageCache,
                    event,
                    getState,
                    fileManager,
                    LogEvent.ACS_PROCESSING_EDITED_MESSAGE
                  );
                  if (isProcessed) {
                    LoggerUtils.logSkipProcessedEditEvent(event, getState);
                    return;
                  }

                  const activity = await convertEditedMessageEvent(event, getState);
                  if (activity) {
                    next(activity);
                  }
                }
              };

              const onStreamingMessageChunkReceived = async (
                event: StreamingChatMessageChunkReceivedEvent
              ): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  LoggerUtils.logStreamingMessageChunkEventReceived(event);

                  if (!fileManager) {
                    fileManager = getState(StateKey.FileManager);
                  }
                  // value to check if the streaming is just started or if it's an update of the existing streaming message
                  const versionOfMessageExistsInCache = messageCache.has(event.id);
                  const isProcessed = cacheTextMessageIfNeeded(
                    messageCache,
                    event,
                    getState,
                    fileManager,
                    LogEvent.ACS_PROCESSING_STREAMING_CHAT_MESSAGE_CHUNK
                  );

                  if (isProcessed) {
                    LoggerUtils.logStreamingMessageChunkEventAlreadyProcessed(event);
                    return;
                  }

                  const activity = await convertStreamingMessageChunkEvent(
                    event,
                    getState,
                    versionOfMessageExistsInCache
                  );
                  if (activity) {
                    next(activity);
                  }
                }
              };

              const onParticipantsAdded = async (event: ParticipantsAddedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                    LoggerUtils.logCacheParticipantsAddedEvent(event);
                    newMessagesBeforeWebChatInit.push(event);
                    return;
                  }
                  LoggerUtils.logParticipantAddedEventReceived(event);

                  const isProcessed = cacheParticipantAddedEventIfNeeded(messageCache, event, getState);
                  if (isProcessed) {
                    LoggerUtils.logParticipantAddedEventAlreadyProcessed(getState, event);
                    return;
                  }
                  processParticipants(event.participantsAdded, Constants.PARTICIPANT_JOINED, getState, next);
                }
              };

              const onParticipantsRemoved = async (event: ParticipantsRemovedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
                    LoggerUtils.logCacheParticipantRemovedEvent(event);
                    newMessagesBeforeWebChatInit.push(event);
                    return;
                  }

                  LoggerUtils.logParticipantRemovedEventReceived(event);
                  const isProcessed = cacheParticipantRemovedEventIfNeeded(messageCache, event, getState);
                  if (isProcessed) {
                    LoggerUtils.logParticipantRemovedEventAlreadyProcessed(getState, event);
                    return;
                  }

                  processParticipants(event.participantsRemoved, Constants.PARTICIPANT_LEFT, getState, next);
                }
              };

              const onChatThreadDeleted = async (event: ChatThreadDeletedEvent): Promise<void> => {
                if (event.threadId === getState(StateKey.ThreadId)) {
                  LoggerUtils.logThreadDeletedReceived(event);
                  const activity = await convertThreadDelete(event);
                  next(activity);
                }
              };

              chatClient.on('chatMessageReceived', onMessageReceived);
              LoggerUtils.logRegisterToEvent(LogEvent.REGISTER_ON_NEW_MESSAGE, `new message`);

              chatClient.on('typingIndicatorReceived', onTypingMessageReceived);
              LoggerUtils.logRegisterToEvent(LogEvent.REGISTER_ON_TYPING_INDICATOR, `typing indicator`);

              chatClient.on('chatMessageEdited', onMessageEdited);
              LoggerUtils.logRegisterToEvent(LogEvent.REGISTER_ON_MESSAGE_EDIT, `message edit`);

              chatClient.on('chatMessageDeleted', onMessageDeleted);
              LoggerUtils.logRegisterToEvent(LogEvent.REGISTER_ON_MESSAGE_DELETED, `message delete`);

              chatClient.on('chatThreadDeleted', onChatThreadDeleted);
              LoggerUtils.logRegisterToEvent(LogEvent.REGISTER_ON_THREAD_DELETED, `thread delete`);

              chatClient.on('realTimeNotificationConnected', onRealtimeNotificationConnected);
              LoggerUtils.logRegisterToEvent(
                LogEvent.REGISTER_ON_REALTIME_NOTIFICATION_CONNECTED,
                `realtime notification connected`
              );

              chatClient.on('realTimeNotificationDisconnected', onRealtimeNotificationDisconnected);
              LoggerUtils.logRegisterToEvent(
                LogEvent.REGISTER_ON_REALTIME_NOTIFICATION_DISCONNECTED,
                `realtime notification disconnected`
              );

              chatClient.on('streamingChatMessageChunkReceived', onStreamingMessageChunkReceived);
              LoggerUtils.logRegisterToEvent(
                LogEvent.REGISTER_ON_STREAMING_CHAT_MESSAGE_CHUNK_RECEIVED,
                `streaming chat message chunk received`
              );

              // notify thread members add/leave notifcation if enableThreadMemberUpdateNotification is set
              if (adapterOptions?.enableThreadMemberUpdateNotification) {
                chatClient.on('participantsAdded', onParticipantsAdded);
                LoggerUtils.logRegisterToEvent(LogEvent.REGISTER_ON_PARTICIPANT_ADDED, `participant added`);

                chatClient.on('participantsRemoved', onParticipantsRemoved);
                LoggerUtils.logRegisterToEvent(LogEvent.REGISTER_ON_PARTICIPANT_REMOVED, `participant removed`);
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
                  LoggerUtils.logCancelPollingCallback(
                    getState,
                    'ACS Adapter: Canceling polling, if any, at the start ' + pollingCallbackId
                  );
                  clearTimeout(pollingCallbackId);
                }
                pollForMessages(getState(StateKey.PollingInterval), chatThreadClient);
              }

              return () => {
                unsubscribedRef.unsubscribed = true;
                chatClient.off('chatMessageReceived', onMessageReceived);
                chatClient.off('typingIndicatorReceived', onTypingMessageReceived);
                chatClient.off('chatMessageEdited', onMessageEdited);
                chatClient.off('chatMessageDeleted', onMessageDeleted);
                chatClient.off('participantsAdded', onParticipantsAdded);
                chatClient.off('participantsRemoved', onParticipantsRemoved);
                chatClient.off('chatThreadDeleted', onChatThreadDeleted);
                chatClient.off('streamingChatMessageChunkReceived', onStreamingMessageChunkReceived);
              };
            })
          );
        }

        return next(key, value);
      };
    }
  );
}
