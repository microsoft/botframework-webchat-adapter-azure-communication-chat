import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { AdapterOptions } from '../types/AdapterTypes';
import { AuthConfig } from '../sdk/Auth';
import EventManager from '../utils/EventManager';
import { IFileManager } from '../types/FileManagerTypes';
import { IMessagePollingHandle } from '../types/MessagePollingTypes';

enum StateKey {
  BotId = 'acs.botId',
  ChatClient = 'acs.chatClient',
  ChatThreadClient = 'acs.chatThreadClient',
  Reconnect = 'acs.reconnect',
  UserId = 'acs.userId',
  UserDisplayName = 'acs.userDisplayName',
  AuthConfig = 'acs.authConfig',
  ConnectionStatusObserverReady = 'dl.connectionStatusObserverReady',
  ThreadId = 'acs.threadId',
  DisconnectUTC = 'acs.disconnectUTC',
  AdapterOptions = 'acs.adapterOptions',
  EventManager = 'acs.eventManager',
  EnvironmentUrl = 'acs.environmentUrl',
  Token = 'acs.token',
  FileManager = 'fileManager',
  PollingInterval = 'pollingInterval',
  WebChatStatus = 'webChatStatus',
  MessagePollingHandleInstance = 'messagePollingHandleInstance'
}

export { StateKey };

export type ACSAdapterState = {
  [StateKey.BotId]: string;
  [StateKey.ChatThreadClient]: ChatThreadClient;
  [StateKey.ChatClient]: ChatClient;
  [StateKey.UserId]: string;
  [StateKey.UserDisplayName]: string;
  [StateKey.AuthConfig]: AuthConfig;
  [StateKey.ThreadId]: string;
  [StateKey.ConnectionStatusObserverReady]: boolean;
  [StateKey.DisconnectUTC]: Date;
  [StateKey.AdapterOptions]: AdapterOptions;
  [StateKey.EventManager]: EventManager;
  [StateKey.EnvironmentUrl]: string;
  [StateKey.Token]: string;
  [StateKey.Reconnect]: string;
  [StateKey.FileManager]: IFileManager;
  [StateKey.PollingInterval]: number;
  [StateKey.WebChatStatus]: string;
  [StateKey.MessagePollingHandleInstance]: IMessagePollingHandle;
};
