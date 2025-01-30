import { ChatClient } from '@azure/communication-chat';
interface UserTokenResponse {
    id: string;
    token: string;
    expiresOn: Date;
    environmentUrl: string;
    displayName: string;
}
export declare const authForNewUser: () => Promise<UserTokenResponse>;
export declare const threadInitialize: () => Promise<{
    userId: string;
    token: string;
    threadId: string;
    environmentUrl: string;
    displayName: string;
    chatClient: ChatClient;
}>;
export {};
//# sourceMappingURL=threadInitialize.d.ts.map