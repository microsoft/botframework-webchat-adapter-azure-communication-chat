export interface IMessagePollingHandle {
    getIsPollingEnabled: () => boolean;
    stopPolling: () => boolean;
}
export declare class MessagePollingHandle implements IMessagePollingHandle {
    protected messagePoller: IMessagePollingHandle;
    constructor(messagePoller: IMessagePollingHandle | undefined);
    getIsPollingEnabled: () => boolean;
    stopPolling: () => boolean;
}
//# sourceMappingURL=MessagePollingTypes.d.ts.map