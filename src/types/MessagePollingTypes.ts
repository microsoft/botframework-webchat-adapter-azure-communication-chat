export interface IMessagePollingHandle {
  getIsPollingEnabled: () => boolean;
  stopPolling: () => boolean;
}

export class MessagePollingHandle implements IMessagePollingHandle {
  protected messagePoller: IMessagePollingHandle;

  constructor(messagePoller: IMessagePollingHandle | undefined) {
    this.messagePoller = messagePoller;
  }

  getIsPollingEnabled = (): boolean => {
    return this.messagePoller ? this.messagePoller.getIsPollingEnabled() : true;
  };

  stopPolling = (): boolean => {
    return this.messagePoller ? this.messagePoller.stopPolling() : false;
  };
}
