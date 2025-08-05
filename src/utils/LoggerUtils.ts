import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Logger, LogLevel } from '../log/Logger';
import { LogEvent } from '../types/LogTypes';
import {
  ChatMessage,
  ChatMessageDeletedEvent,
  ChatMessageEditedEvent,
  ChatMessageReceivedEvent,
  ChatParticipant,
  ChatThreadDeletedEvent,
  ParticipantsAddedEvent,
  ParticipantsRemovedEvent,
  SendMessageRequest,
  SendTypingNotificationOptions,
  StreamingChatMessageChunkReceivedEvent,
  TypingIndicatorReceivedEvent
} from '@azure/communication-chat';
import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import { GetStateFunction } from '../types/AdapterTypes';
import { ChatEventMessage } from './ConvertMessageUtils';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { ProcessChatMessageEventProps } from '../ingress/ingressHelpers';

export class LoggerUtils {
  static logSimpleInfoEvent = (event: LogEvent, description: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: event,
      Description: description
    });
  };

  static logSimpleErrorEvent = (event: LogEvent, description: string, exception?: Error): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: event,
      Description: description,
      ...(exception ? { ExceptionDetails: exception } : {})
    });
  };

  static logSimpleDebugEvent = (event: LogEvent, description: string): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: event,
      Description: description,
      TimeStamp: new Date().toISOString()
    });
  };

  static logConvertStreamingMessageChunkEvent = (event: StreamingChatMessageChunkReceivedEvent): void => {
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

  static logStreamingMessageChunkEventReceived = (event: StreamingChatMessageChunkReceivedEvent): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.STREAMING_CHAT_MESSAGE_CHUNK_RECEIVED,
      Description: `ACS Adapter: Received a message streaming chunk event with id ${event.id}`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.editedOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logStreamingMessageChunkEventAlreadyProcessed = (event: StreamingChatMessageChunkReceivedEvent): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_SKIP_STREAMING_CHAT_MESSAGE_CHUNK,
      Description: `ACS Adapter: Skipping RTN streaming message chunk, already processed`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.editedOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logIngressStreamingChunkFailed = (
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

  static logParticipantAddedEventReceived = (event: ParticipantsAddedEvent): void => {
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

  static logParticipantRemovedEventReceived = (event: ParticipantsRemovedEvent): void => {
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

  static logCachedPagedHistoryMessage = (
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

  static logConvertHistoryMessage = (chatMessage: ChatMessage, description: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
      Description: description,
      CustomProperties: chatMessage, // remove content to protect sensitive user info
      MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: chatMessage.createdOn.toISOString(),
      ChatMessageId: chatMessage.id
    });
  };

  static logAdapterPollingSkipped = (getState: GetStateFunction<ACSAdapterState>, description: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_POLLING_SKIPPED,
      Description: description,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logSendPollingRequest = (getState: GetStateFunction<ACSAdapterState>): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_SEND_POLLING_REQUEST,
      Description: 'ACS Adapter: Send polling request',
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logPollingMessageFetchFailed = (getState: GetStateFunction<ACSAdapterState>, exception: Error): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_SDK_CHATCLIENT_ERROR,
      Description: `ACS Adapter: Polling message fetch failed.`,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ExceptionDetails: exception
    });
  };

  static logPollingCallbackCreated = (getState: GetStateFunction<ACSAdapterState>, pollingCallbackId: number): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_CREATE_POLLING_CALLBACK,
      Description: 'ACS Adapter: Created polling callback with Id ' + pollingCallbackId,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logPollingCallStopped = (getState: GetStateFunction<ACSAdapterState>): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_POLLING_STOPPED,
      Description: 'ACS Adapter: Polling call stopped from the client',
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logPollingStatusCode = (getState: GetStateFunction<ACSAdapterState>, statusCode: number): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_POLLING_STATUSCODE,
      Description: 'ACS Adapter: Polling status code ' + statusCode,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logSkipProcessedPolledMessage = (getState: GetStateFunction<ACSAdapterState>, messageId: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_SKIP_POLLED_MESSAGE,
      Description: 'ACS Adapter: Skipping polled message, already processed',
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: messageId,
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logProcessingPolledMessage = (getState: GetStateFunction<ACSAdapterState>, messageId: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_PROCESSING_POLLED_MESSAGE,
      Description: 'ACS Adapter: Processing polled message ' + messageId,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: messageId,
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logCachePolledHistoryMessage = (getState: GetStateFunction<ACSAdapterState>, messageId: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.CACHE_POLLED_HISTORY_MESSAGE,
      Description: 'ACS Adapter: Cache polled history message',
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId),
      ChatMessageId: messageId
    });
  };

  static logAdapterPostActivity = (
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

  static logProcessCachedPagedHistoryMessage = (
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

  static logProcessingParticipantAddedEvent = (
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

  static logProcessingParticipantRemovedEvent = (
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

  static logParticipantAddedEventAlreadyProcessed = (
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

  static logParticipantRemovedEventAlreadyProcessed = (
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

  static logCacheParticipantsAddedEvent = (event: ParticipantsAddedEvent): void => {
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

  static logCacheParticipantRemovedEvent = (event: ParticipantsRemovedEvent): void => {
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

  static logProcessPolledCachedHistoryMessage = (
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

  static logProcessCachedTextMessage = (event: ChatMessageReceivedEvent): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.PROCESS_CACHED_NEW_MESSAGE,
      Description: `ACS Adapter: Process cached new message with id ${event.id}`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.createdOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logProcessCachedParticipantsAddedEvent = (event: ParticipantsAddedEvent): void => {
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

  static logProcessCachedParticipantsRemovedEvent = (event: ParticipantsRemovedEvent): void => {
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

  static logUnsupportedMessageType = (message: ChatMessage): void => {
    this.logSimpleDebugEvent(
      LogEvent.UNSUPPORTED_MESSAGE_TYPE,
      `Message with ${message.id} has unsupported message type: ${message.type}`
    );
  };

  static logEditEventIngressFailed = (
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

  static logDeletedMessageEventIngressFailed = (
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

  static logSkipProcessedEditEvent = (
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

  static logSkipProcessedDeletedMessageEvent = (
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

  static logMessageEditEventReceived = (event: ChatMessageEditedEvent): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.MESSAGE_EDIT_RECEIVED,
      Description: `ACS Adapter: Received a message edit event with id ${event.id}`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.editedOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logMessageDeletedEventReceived = (event: ChatMessageDeletedEvent): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.MESSAGE_DELETED_RECEIVED,
      Description: `ACS Adapter: Received a message delete event with id ${event.id}`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.deletedOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logConvertEditedMessageEvent = (event: ChatMessageEditedEvent): void => {
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

  static logConvertDeletedMessageEvent = (event: ChatMessageDeletedEvent): void => {
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

  static logConvertFetchedMessageFailed = (
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

  static logEditEventFailedMetadataParsing = (
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

  static logFileManagerDownloadFileFailed = (exception: Error): void => {
    this.logSimpleErrorEvent(
      LogEvent.FILEMANAGER_DOWNLOAD_FILE_FAILED,
      `Downloading attachment for message failed.`,
      exception
    );
  };

  static logSDKStartInitError = (
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

  static logSDKStartInit = (threadId: string, requesterUserId: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_SDK_START_INIT,
      ChatThreadId: threadId,
      ACSRequesterUserId: requesterUserId,
      Description: `ACS Adapter: ACS Adapter start init.`
    });
  };

  static logFileManagerUploadFileRequest = (getState: GetStateFunction<ACSAdapterState>, timestamp: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.FILEMANAGER_UPLOAD_FILE_REQUEST,
      Description: `Sending upload file request`,
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId)
    });
  };

  static logFileManagerUploadFileFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    timestamp: string,
    exception: Error
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.FILEMANAGER_UPLOAD_FILE_FAILED,
      Description: `Uploading file failed`,
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId),
      ExceptionDetails: exception
    });
  };

  static logEgressFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    timestamp: string,
    messageId: string,
    errorMessage: string
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_EGRESS_FAILED,
      Description: errorMessage,
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: messageId
    });
  };

  static logEgressMessage = (
    getState: GetStateFunction<ACSAdapterState>,
    timestamp: string,
    messageId: string
  ): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_EGRESS_MESSAGE,
      Description: 'Convert activity to egress ACS message',
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: messageId
    });
  };

  static logEgressSendMessage = (
    getState: GetStateFunction<ACSAdapterState>,
    timestamp: string,
    messageId: string
  ): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_EGRESS_SEND_MESSAGE,
      Description: 'Convert activity to egress ACS message',
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: messageId
    });
  };

  static logEgressSendMessageSuccess = (
    getState: GetStateFunction<ACSAdapterState>,
    activity: ACSDirectLineActivity,
    sendMessageRequest: SendMessageRequest,
    sentResultId: string
  ): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.ACS_ADAPTER_SEND_MESSAGE_SUCCESS,
      Description: `Adapter: Successfully sent a message with messageid ${sentResultId}.`,
      CustomProperties: sendMessageRequest,
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: activity.messageid,
      ClientActivityId: activity?.channelData?.clientActivityID as string
    });
  };

  static logEgressSendMessageFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    activity: ACSDirectLineActivity,
    sendMessageRequest: SendMessageRequest,
    exception: Error
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_SEND_MESSAGE_FAILED,
      Description: `Send message failed.`,
      CustomProperties: sendMessageRequest,
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: activity.messageid,
      ClientActivityId: activity?.channelData?.clientActivityID as string,
      ExceptionDetails: exception
    });
  };

  static logEgressTypingFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    timestamp: string,
    errorMessage: string
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_EGRESS_TYPING_FAILED,
      Description: errorMessage,
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId)
    });
  };

  static logEgressTypingSendingRequest = (getState: GetStateFunction<ACSAdapterState>, timestamp: string): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.ACS_ADAPTER_EGRESS_TYPING_SENDING_REQUEST,
      Description: 'ACS Adapter: Request sending a typing indication',
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId)
    });
  };

  static logIngressTypingSuccess = (getState: GetStateFunction<ACSAdapterState>, timestamp: string): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.ACS_ADAPTER_INGRESS_TYPING_SUCCESS,
      Description: 'ACS Adapter: Successfully sent a typing indication',
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: timestamp,
      ChatThreadId: getState(StateKey.ThreadId)
    });
  };

  static logEgressTypingSendFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    activity: ACSDirectLineActivity,
    options: SendTypingNotificationOptions,
    exception: Error
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_SEND_MESSAGE_FAILED,
      Description: `Send message failed.`,
      CustomProperties: options,
      ACSRequesterUserId: getState(StateKey.UserId),
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: activity.messageid,
      ClientActivityId: activity?.channelData?.clientActivityID as string,
      ExceptionDetails: exception
    });
  };

  static logProcessingTextMessage = (
    getState: GetStateFunction<ACSAdapterState>,
    event: ProcessChatMessageEventProps,
    processingLogEvent: LogEvent
  ): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: processingLogEvent,
      Description: `ACS Adapter: Processing message`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: event.id
    });
  };

  static logACSReconnectError = (description: string, exception?: Error): void => {
    this.logSimpleErrorEvent(LogEvent.ACS_SDK_CHATCLIENT_RECONNECT_ERROR, description, exception);
  };

  static logHistoryMessageIngressFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    message: ChatMessage,
    errorMessage: string
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
      Description: errorMessage,
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: message.createdOn.toISOString(),
      ChatMessageId: message.id
    });
  };

  static logQueueAttachmentDownloadFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    message: ChatMessage,
    exception: Error
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
      Description: 'Failed to queue attachments download',
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: message.createdOn.toISOString(),
      ChatMessageId: message.id,
      ExceptionDetails: exception
    });
  };

  static logUserMessageIngressFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    event: ChatMessageReceivedEvent,
    errorMessage: string
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
      Description: errorMessage,
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.createdOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logRequestDownloadAttachments = (
    getState: GetStateFunction<ACSAdapterState>,
    event: ChatMessageReceivedEvent
  ): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_REQUEST_DOWNLOAD_ATTACHMENTS,
      Description: 'Preparing to download attachments',
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.createdOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logDownloadAttachmentsFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    event: ChatMessageReceivedEvent,
    exception: Error
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
      Description: 'Failed to download attachments',
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.createdOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id,
      ExceptionDetails: exception
    });
  };

  static logAttachmentEvent = (
    getState: GetStateFunction<ACSAdapterState>,
    chatMessage: ChatMessage,
    description: string
  ): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_CONVERT_HISTORY,
      Description: description,
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: chatMessage.createdOn.toISOString(),
      ChatMessageId: chatMessage.id
    });
  };

  static logAttachmentErrorEvent = (
    getState: GetStateFunction<ACSAdapterState>,
    chatMessage: ChatMessage,
    eventType: LogEvent,
    description: string,
    exception: Error
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: eventType,
      Description: description,
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: chatMessage.createdOn.toISOString(),
      ChatMessageId: chatMessage.id,
      ExceptionDetails: exception
    });
  };

  static logProcessingAttachments = (event: LogEvent, description: string, messageId: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: event,
      Description: description,
      TimeStamp: new Date().toISOString(),
      ChatMessageId: messageId
    });
  };

  static logProcessingStreamingChatMessageChunkError = (
    event: StreamingChatMessageChunkReceivedEvent,
    getState: GetStateFunction<ACSAdapterState>,
    exception: Error
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_PROCESSING_STREAMING_CHAT_MESSAGE_CHUNK,
      Description: 'Failed to parse StreamingChatMessageChunk metadata',
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.editedOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id,
      ExceptionDetails: exception
    });
  };

  static logConvertMessage = (event: ChatMessageReceivedEvent): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_CONVERT_MESSAGE,
      Description: `ACS Adapter: convert normal message`,
      CustomProperties: event,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.createdOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logTypingMessageIngressFailed = (
    getState: GetStateFunction<ACSAdapterState>,
    message: TypingIndicatorReceivedEvent,
    errorMessage: string
  ): void => {
    Logger.logEvent(LogLevel.ERROR, {
      Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
      Description: errorMessage,
      ACSRequesterUserId: getState(StateKey.UserId),
      MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: message.receivedOn.toISOString(),
      ChatThreadId: message.threadId
    });
  };

  static logConvertTypingMessage = (message: TypingIndicatorReceivedEvent): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_CONVERT_TYPING_MESSAGE,
      Description: 'ACS Adapter: convert typing message.',
      MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: message.receivedOn.toISOString(),
      ChatThreadId: message.threadId
    });
  };

  static logConvertThreadDelete = (event: ChatThreadDeletedEvent): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_CONVERT_THREAD_DELETED,
      Description: 'ACS Adapter: convert thread delete',
      ACSRequesterUserId: (event.deletedBy.id as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.deletedOn.toISOString(),
      ChatThreadId: event.threadId
    });
  };

  static logCancelPollingCallback = (getState: GetStateFunction<ACSAdapterState>, description: string): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_CANCEL_POLLING_CALLBACK,
      Description: description,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId)
    });
  };

  static logAttachmentDownloaded = (chatMessage: ChatMessage, files: File[]): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_ATTACHMENT_DOWNLOADED,
      Description: 'ACS Adapter: Attachment downloaded ' + files?.map((file) => file.name).join(','),
      MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: chatMessage.createdOn.toISOString(),
      ChatMessageId: chatMessage.id
    });
  };

  static logPostFileActivity = (chatMessage: ChatMessage, activity: ACSDirectLineActivity): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_ADAPTER_POST_FILE_ACTIVITY,
      Description: 'ACS Adapter: Post file attachment activity, messageId: ' + activity.messageid,
      MessageSender: (chatMessage.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: chatMessage.createdOn.toISOString(),
      ChatMessageId: chatMessage.id
    });
  };

  static logMessageReceived = (event: ChatMessageReceivedEvent): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.MESSAGE_RECEIVED,
      Description: `ACS Adapter: Received a message with id ${event.id}`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.createdOn.toISOString(),
      ChatThreadId: event.threadId,
      ChatMessageId: event.id
    });
  };

  static logCacheNewMessage = (event: ChatMessageReceivedEvent, getState: GetStateFunction<ACSAdapterState>): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.CACHE_NEW_MESSAGE,
      Description: 'ACS Adapter: Cache new message',
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ACSRequesterUserId: getState(StateKey.UserId),
      ChatMessageId: event.id
    });
  };

  static logSkipNewMessage = (event: ChatMessageReceivedEvent, getState: GetStateFunction<ACSAdapterState>): void => {
    Logger.logEvent(LogLevel.INFO, {
      Event: LogEvent.ACS_SKIP_NEW_MESSAGE,
      Description: `ACS Adapter: Skipping RTN message, already processed`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: new Date().toISOString(),
      ChatThreadId: getState(StateKey.ThreadId),
      ChatMessageId: event.id
    });
  };

  static logTypingMessageReceived = (event: TypingIndicatorReceivedEvent): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.TYPING_MESSAGE_RECEIVED,
      Description: `ACS Adapter: Received a typing message`,
      MessageSender: (event.sender as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.receivedOn.toISOString(),
      ChatThreadId: event.threadId
    });
  };

  static logThreadDeletedReceived = (event: ChatThreadDeletedEvent): void => {
    Logger.logEvent(LogLevel.DEBUG, {
      Event: LogEvent.THREAD_DELETED_RECEIVED,
      Description: `ACS Adapter: Received a thread deleted event`,
      ACSRequesterUserId: (event.deletedBy.id as CommunicationUserIdentifier).communicationUserId,
      TimeStamp: event.deletedOn.toISOString(),
      ChatThreadId: event.threadId
    });
  };

  static logRegisterToEvent = (event: LogEvent, eventDescription: string): void => {
    this.logSimpleDebugEvent(event, `ACS Adapter: Registering on ${eventDescription}`);
  };
}
