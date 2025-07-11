import { CommunicationTokenCredential } from '@azure/communication-common';
import { ChatClient, ChatThreadClient } from '@azure/communication-chat';

const emptyFunction = (): any => {
  return;
};

export const communicationUserCredential: CommunicationTokenCredential = {
  getToken: emptyFunction,
  dispose: emptyFunction
};

const chatClient: any = {
  on: jest.fn(),
  createChatThread: jest.fn(),
  getChatThread: jest.fn()
};

export const MockChatClient = (): ChatClient => {
  return { ...chatClient };
};

const chatThreadClient: any = {
  createChatThread: jest.fn(),
  getProperties: jest.fn()
};

export const MockChatThreadClient = (): ChatThreadClient => {
  return { ...chatThreadClient };
};
