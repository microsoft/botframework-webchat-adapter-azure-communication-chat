import { Middleware, Store } from 'redux';
export type DirectLine = any;
export interface WebChat {
    createStore: (directLine: DirectLine, ...middleWare: Middleware[]) => Store;
    createDirectLine: (token: string) => DirectLine;
}
//# sourceMappingURL=WebChatTypes.d.ts.map