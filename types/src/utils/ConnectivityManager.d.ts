import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
export default class ConnectivityManager {
    static isACSConnected(chatClient: ChatClient, chatThreadClient: ChatThreadClient): Promise<boolean>;
    private static isNotRetryable;
}
//# sourceMappingURL=ConnectivityManager.d.ts.map