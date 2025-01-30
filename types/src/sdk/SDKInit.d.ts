import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
export declare const SDKInit: (token: string, id: string, threadId: string, environmentUrl: string, displayName?: string, chatClient?: ChatClient) => Promise<{
    chatClient: ChatClient;
    chatThreadClient: ChatThreadClient;
}>;
//# sourceMappingURL=SDKInit.d.ts.map