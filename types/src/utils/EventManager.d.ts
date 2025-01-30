import EventTarget, { Event } from 'event-target-shim';
export declare class CustomEvent extends Event<string> {
    detail: any;
    constructor(eventName: string, detail: any);
}
export default class EventManager extends EventTarget {
    raiseCustomEvent(eventName: string, payload?: any): void;
    constructor();
    end(): void;
    handleOnline: () => Promise<void>;
    handleOffline: () => Promise<void>;
    handleLeaveChat: () => Promise<void>;
    handleAcsChatOnline: () => Promise<void>;
    handleBeforeunload: () => void;
    handleError: (error: Error) => Promise<void>;
    handleLoadMoreHistoryMessages: () => Promise<void>;
}
//# sourceMappingURL=EventManager.d.ts.map