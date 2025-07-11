import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Logger, LogLevel } from '../log/Logger';
import { LogEvent } from '../types/LogTypes';
import {
  ChatMessage,
  ChatMessageDeletedEvent,
  ChatMessageEditedEvent,
  ChatMessageReceivedEvent,
  ChatParticipant,
  ParticipantsAddedEvent,
  ParticipantsRemovedEvent,
  StreamingChatMessageChunkReceivedEvent
} from '@azure/communication-chat';
import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import { GetStateFunction } from '../types/AdapterTypes';
import { ChatEventMessage } from './ConvertMessageUtils';

export const logConvertStreamingMessageChunkEvent = (event: StreamingChatMessageChunkReceivedEvent): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_CONVERT_STREAMING_CHAT_MESSAGE_CHUNK,
    Description: 'ACS Adapter: convert streaming message chunk',
    CustomProperties: event,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logStreamingMessageChunkEventReceived = (event: StreamingChatMessageChunkReceivedEvent): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.STREAMING_CHAT_MESSAGE_CHUNK_RECEIVED,
    Description: `ACS Adapter: Received a message streaming chunk event with id ${event.id}`,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logStreamingMessageChunkEventAlreadyProcessed = (event: StreamingChatMessageChunkReceivedEvent): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_SKIP_STREAMING_CHAT_MESSAGE_CHUNK,
    Description: `ACS Adapter: Skipping RTN streaming message chunk, already processed`,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logIngressStreamingChunkFailed = (
  event: StreamingChatMessageChunkReceivedEvent,
  getState: GetStateFunction<ACSAdapterState>,
  errorMessage?: string
): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_ADAPTER_INGRESS_STREAMING_CHAT_MESSAGE_CHUNK_FAILED,
    Description: errorMessage,
    ACSRequesterUserId: getState(StateKey.UserId),
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logParticipantAddedEventReceived = (event: ParticipantsAddedEvent): void => {
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
};

export const logParticipantRemovedEventReceived = (event: ParticipantsRemovedEvent): void => {
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
};

export const logConvertThreadUpdateEvent = (): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_CONVERT_THREAD_UPDATED,
    Description: 'ACS Adapter: convert thread update'
  });
};

export const logCachedPagedHistoryMessage = (
  description: string,
  chatMessage: ChatMessage,
  getState: GetStateFunction<ACSAdapterState>
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.CACHE_PAGED_HISTORY_MESSAGE,
    Description: description,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId),
    ChatMessageId: chatMessage.id
  });
};

export const logConvertHistoryTextMessage = (chatMessage: ChatMessage): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
    Description: 'ACS Adapter: convert history message:',
    CustomProperties: chatMessage, // remove content to protect sensitive user info
    MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: chatMessage.createdOn.toISOString(),
    ChatMessageId: chatMessage.id
  });
};

export const logAdapterPollingSkipped = (getState: GetStateFunction<ACSAdapterState>, description: string): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_POLLING_SKIPPED,
    Description: description,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logSendPollingRequest = (getState: GetStateFunction<ACSAdapterState>): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_SEND_POLLING_REQUEST,
    Description: 'ACS Adapter: Send polling request',
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logPollingMessageFetchFailed = (getState: GetStateFunction<ACSAdapterState>, exception: Error): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_SDK_CHATCLIENT_ERROR,
    Description: `ACS Adapter: Polling message fetch failed.`,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ExceptionDetails: exception
  });
};

export const logCancellingPollingCallback = (
  getState: GetStateFunction<ACSAdapterState>,
  pollingCallbackId: number
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_CANCEL_POLLING_CALLBACK,
    Description: 'ACS Adapter: Canceling polling callback with Id ' + pollingCallbackId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logPollingCallbackCreated = (
  getState: GetStateFunction<ACSAdapterState>,
  pollingCallbackId: number
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_CREATE_POLLING_CALLBACK,
    Description: 'ACS Adapter: Created polling callback with Id ' + pollingCallbackId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logPollingCallStopped = (getState: GetStateFunction<ACSAdapterState>): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_POLLING_STOPPED,
    Description: 'ACS Adapter: Polling call stopped from the client',
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logPollingStatusCode = (getState: GetStateFunction<ACSAdapterState>, statusCode: number): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_POLLING_STATUSCODE,
    Description: 'ACS Adapter: Polling status code ' + statusCode,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logCancelPolling = (getState: GetStateFunction<ACSAdapterState>, pollingCallbackId: number): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_CANCEL_POLLING_CALLBACK,
    Description: 'ACS Adapter: Canceling polling in RTN connected callback Id ' + pollingCallbackId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logSkipProcessedPolledMessage = (getState: GetStateFunction<ACSAdapterState>, messageId: string): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_SKIP_POLLED_MESSAGE,
    Description: 'ACS Adapter: Skipping polled message, already processed',
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ChatMessageId: messageId,
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logProcessingPolledMessage = (getState: GetStateFunction<ACSAdapterState>, messageId: string): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_PROCESSING_POLLED_MESSAGE,
    Description: 'ACS Adapter: Processing polled message ' + messageId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ChatMessageId: messageId,
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logCachePolledHistoryMessage = (getState: GetStateFunction<ACSAdapterState>, messageId: string): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.CACHE_POLLED_HISTORY_MESSAGE,
    Description: 'ACS Adapter: Cache polled history message',
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ACSRequesterUserId: getState(StateKey.UserId),
    ChatMessageId: messageId
  });
};

export const logAdapterPostActivity = (
  getState: GetStateFunction<ACSAdapterState>,
  description: string,
  message: ChatMessage
): void => {
  const messageSender = message.type === 'text' ? message.sender : message.content.initiator;
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_POST_ACTIVITY,
    Description: description,
    MessageSender: (messageSender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: message.createdOn.toISOString(),
    ChatMessageId: message.id,
    ACSRequesterUserId: getState(StateKey.UserId)
  });
};

export const logWebChatConnectedEvent = (): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.WEBCHAT_STATUS_CONNECTED,
    Description: `ACS Adapter: Event Webchat connected received`
  });
};

export const logProcessCachedPagedHistoryMessage = (
  getState: GetStateFunction<ACSAdapterState>,
  message: ChatMessage
): void => {
  const messageSender = message.type === 'text' ? message.sender : message.content.initiator;
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.PROCESS_CACHED_PAGED_HISTORY_MESSAGE,
    Description: `ACS Adapter: Process cached history message with id ${message.id}`,
    MessageSender: (messageSender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: message.createdOn.toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ChatMessageId: message.id
  });
};

export const logProcessingParticipantAddedEvent = (
  getState: GetStateFunction<ACSAdapterState>,
  event: ParticipantsAddedEvent
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_PROCESSING_PARTICIPANT_ADDED_EVENT,
    Description: `ACS Adapter: Processing participant added event`,
    ACSRequesterUserId: (event.addedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    UserAdded: event.participantsAdded.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logProcessingParticipantRemovedEvent = (
  getState: GetStateFunction<ACSAdapterState>,
  event: ParticipantsRemovedEvent
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_PROCESSING_PARTICIPANT_ADDED_EVENT,
    Description: `ACS Adapter: Processing participant removed event`,
    ACSRequesterUserId: (event.removedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    UserRemoved: event.participantsRemoved.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logParticipantAddedEventAlreadyProcessed = (
  getState: GetStateFunction<ACSAdapterState>,
  event: ParticipantsAddedEvent
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_PARTICIPANT_ADDED_EVENT_PROCESSED,
    Description: `ACS Adapter: Skipping RTN participant added event, already processed`,
    ACSRequesterUserId: (event.addedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    UserAdded: event.participantsAdded.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logParticipantRemovedEventAlreadyProcessed = (
  getState: GetStateFunction<ACSAdapterState>,
  event: ParticipantsRemovedEvent
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_PARTICIPANT_REMOVED_EVENT_PROCESSED,
    Description: `ACS Adapter: Skipping RTN participant removed event, already processed`,
    ACSRequesterUserId: (event.removedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: new Date().toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    UserRemoved: event.participantsRemoved.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logCacheParticipantsAddedEvent = (event: ParticipantsAddedEvent): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.CACHE_NEW_MESSAGE,
    Description: 'ACS Adapter: Cache new participant added event',
    ACSRequesterUserId: (event.addedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.addedOn.toISOString(),
    ChatThreadId: event.threadId,
    UserAdded: event.participantsAdded.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logCacheParticipantRemovedEvent = (event: ParticipantsRemovedEvent): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.CACHE_NEW_MESSAGE,
    Description: `ACS Adapter: Cache new participant added even`,
    ACSRequesterUserId: (event.removedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.removedOn.toISOString(),
    ChatThreadId: event.threadId,
    UserRemoved: event.participantsRemoved.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logProcessPolledCachedHistoryMessage = (
  getState: GetStateFunction<ACSAdapterState>,
  historyMessage: ChatMessage
): void => {
  const messageSender =
    'sender' in historyMessage
      ? historyMessage.sender
      : 'initiator' in historyMessage.content.initiator
      ? historyMessage.content.initiator
      : undefined;
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.PROCESS_CACHED_HISTORY_MESSAGE,
    Description: `ACS Adapter: Process polled cached history message with Id ${historyMessage.id}`,
    MessageSender: messageSender && (messageSender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: historyMessage.createdOn.toISOString(),
    ChatThreadId: getState(StateKey.ThreadId),
    ChatMessageId: historyMessage.id
  });
};

export const logProcessCachedTextMessage = (event: ChatMessageReceivedEvent): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.PROCESS_CACHED_NEW_MESSAGE,
    Description: `ACS Adapter: Process cached new message with id ${event.id}`,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.createdOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logProcessCachedParticipantsAddedEvent = (event: ParticipantsAddedEvent): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.PROCESS_CACHED_NEW_MESSAGE,
    Description: `ACS Adapter: Process cached new participants added event`,
    ACSRequesterUserId: (event.addedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.addedOn.toISOString(),
    ChatThreadId: event.threadId,
    UserAdded: event.participantsAdded.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logProcessCachedParticipantsRemovedEvent = (event: ParticipantsRemovedEvent): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.PROCESS_CACHED_NEW_MESSAGE,
    Description: `ACS Adapter: Process cached new participants removed event`,
    ACSRequesterUserId: (event.removedBy.id as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.removedOn.toISOString(),
    ChatThreadId: event.threadId,
    UserAdded: event.participantsRemoved.map(
      (p: ChatParticipant) => (p.id as CommunicationUserIdentifier).communicationUserId
    )
  });
};

export const logUnsupportedMessageType = (message: ChatMessage): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.UNSUPPORTED_MESSAGE_TYPE,
    Description: `Message with ${message.id} has unsupported message type: ${message.type}`,
    TimeStamp: new Date().toISOString()
  });
};

export const logEditEventIngressFailed = (
  event: ChatMessageEditedEvent,
  errorMessage: string,
  getState: GetStateFunction<ACSAdapterState>
): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
    Description: errorMessage,
    ACSRequesterUserId: getState(StateKey.UserId),
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logDeletedMessageEventIngressFailed = (
  event: ChatMessageDeletedEvent,
  errorMessage: string,
  getState: GetStateFunction<ACSAdapterState>
): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
    Description: errorMessage,
    ACSRequesterUserId: getState(StateKey.UserId),
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.deletedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logSkipProcessedEditEvent = (
  event: ChatMessageEditedEvent,
  getState: GetStateFunction<ACSAdapterState>
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_SKIP_EDITED_MESSAGE,
    Description: 'ACS Adapter: Skipping edited RTN message, already processed',
    TimeStamp: new Date().toISOString(),
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    ChatThreadId: getState(StateKey.ThreadId),
    ChatMessageId: event.id
  });
};

export const logSkipProcessedDeletedMessageEvent = (
  event: ChatMessageDeletedEvent,
  getState: GetStateFunction<ACSAdapterState>
): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_SKIP_DELETED_MESSAGE,
    Description: 'ACS Adapter: Skipping deleted message RTN, already processed',
    TimeStamp: new Date().toISOString(),
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    ChatThreadId: getState(StateKey.ThreadId),
    ChatMessageId: event.id
  });
};

export const logMessageEditEventReceived = (event: ChatMessageEditedEvent): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.MESSAGE_EDIT_RECEIVED,
    Description: `ACS Adapter: Received a message edit event with id ${event.id}`,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logMessageDeletedEventReceived = (event: ChatMessageDeletedEvent): void => {
  Logger.logEvent(LogLevel.DEBUG, {
    Event: LogEvent.MESSAGE_DELETED_RECEIVED,
    Description: `ACS Adapter: Received a message delete event with id ${event.id}`,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.deletedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logConvertEditedMessageEvent = (event: ChatMessageEditedEvent): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_CONVERT_EDITED_MESSAGE,
    Description: 'ACS Adapter: convert edited message',
    CustomProperties: event,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logConvertDeletedMessageEvent = (event: ChatMessageDeletedEvent): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_ADAPTER_CONVERT_DELETED_MESSAGE,
    Description: 'ACS Adapter: convert edited deleted message event',
    CustomProperties: event,
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.deletedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id
  });
};

export const logConvertFetchedMessageFailed = (
  eventMessage: ChatEventMessage,
  errorMessage: string,
  exception: Error
): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
    Description: errorMessage,
    ACSRequesterUserId: eventMessage.currentUserId,
    MessageSender: (eventMessage.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: eventMessage.createdOn.toISOString(),
    ChatThreadId: eventMessage.threadId,
    ChatMessageId: eventMessage.messageId,
    ExceptionDetails: exception
  });
};

export const logEditEventFailedMetadataParsing = (
  event: ChatMessageEditedEvent,
  exception: Error,
  getState: GetStateFunction<ACSAdapterState>
): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
    Description: 'Failed to parse ChatMessage metadata',
    ACSRequesterUserId: getState(StateKey.UserId),
    MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
    TimeStamp: event.editedOn.toISOString(),
    ChatThreadId: event.threadId,
    ChatMessageId: event.id,
    ExceptionDetails: exception
  });
};

export const logFileManagerDownloadFileFailed = (exception: Error): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.FILEMANAGER_DOWNLOAD_FILE_FAILED,
    Description: `Downloading attachment for message failed.`,
    ExceptionDetails: exception
  });
};

export const logSDKStartInitError = (
  threadId: string,
  requesterUserId: string,
  description: string,
  exception?: Error
): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_SDK_START_INIT_ERROR,
    ChatThreadId: threadId,
    ACSRequesterUserId: requesterUserId,
    Description: description,
    ExceptionDetails: exception
  });
};

export const logSDKStartInit = (threadId: string, requesterUserId: string): void => {
  Logger.logEvent(LogLevel.INFO, {
    Event: LogEvent.ACS_SDK_START_INIT,
    ChatThreadId: threadId,
    ACSRequesterUserId: requesterUserId,
    Description: `ACS Adapter: ACS Adapter start init.`
  });
};

export const logSDKJoinThreadError = (): void => {
  Logger.logEvent(LogLevel.ERROR, {
    Event: LogEvent.ACS_SDK_JOINTHREAD_ERROR,
    Description: `ACS Adapter: failed to join the thread.`
  });
};
