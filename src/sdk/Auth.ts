import { ChatThreadProperties } from '@azure/communication-chat';

export const authConfig = {
  id: '',
  environmentUrl: '',
  token: ''
};

export interface AuthConfig {
  id: string;
  environmentUrl: string;
  token: string;
}

interface ThreadConfig {
  threadId: string;
  thread?: ChatThreadProperties;
}

export const threadConfig: ThreadConfig = {
  threadId: '',
  thread: undefined
};
