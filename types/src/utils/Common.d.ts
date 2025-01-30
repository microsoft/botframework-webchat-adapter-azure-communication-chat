import { ChatEqualityFields } from '../types';
export declare const delay: (ms: number) => Promise<void>;
export declare const checkDuplicateMessage: (messageCache: Map<string, ChatEqualityFields>, messageId: string, receivedChatMessage: ChatEqualityFields) => boolean;
//# sourceMappingURL=Common.d.ts.map