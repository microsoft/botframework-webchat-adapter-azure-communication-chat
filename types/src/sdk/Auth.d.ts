import { ChatThreadProperties } from '@azure/communication-chat';
export declare const authConfig: {
    id: string;
    environmentUrl: string;
    token: string;
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
export declare const threadConfig: ThreadConfig;
export {};
//# sourceMappingURL=Auth.d.ts.map