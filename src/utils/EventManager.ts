import EventTarget, { Event, defineEventAttribute } from 'event-target-shim';

export class CustomEvent extends Event<string> {
  public detail: any;

  constructor(eventName: string, detail: any) {
    super(eventName);
    this.detail = detail;
  }
}

export default class EventManager extends EventTarget {
  //this function is not ready to use yet
  public raiseCustomEvent(eventName: string, payload?: any): void {
    // tslint:disable-line:no-any
    const eventDetails = payload ? { payload: payload } : undefined;
    let event: CustomEvent = null;
    try {
      // For non IE11 scenarios, customevent object can be dispatched
      event = new CustomEvent(eventName, eventDetails);
    } catch {
      // Special handling for IE11 scenario, where customevent object cannot be dispatched
      // event = document.createEvent('CustomEvent');
      // event.initCustomEvent(eventName, true, true, eventDetails); // tslint:disable-line:no-any
    }

    this.dispatchEvent(event);
  }

  constructor() {
    super();
    // Checking connection status on online & offline events due to possible false positives
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('beforeunload', this.handleBeforeunload);
    window.addEventListener('acs-adapter-leavechat', this.handleLeaveChat);
    window.addEventListener('acs-adapter-loadnextpage', this.handleLoadMoreHistoryMessages);
  }

  end(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('beforeunload', this.handleBeforeunload);
    window.removeEventListener('acs-adapter-leavechat', this.handleLeaveChat);
    window.removeEventListener('acs-adapter-loadnextpage', this.handleLoadMoreHistoryMessages);
  }

  handleOnline = async (): Promise<void> => {
    this.raiseCustomEvent('online');
  };

  handleOffline = async (): Promise<void> => this.raiseCustomEvent('offline');

  handleLeaveChat = async (): Promise<void> => this.raiseCustomEvent('acs-adapter-leavechat');

  handleAcsChatOnline = async (): Promise<void> => this.raiseCustomEvent('acschat-online');

  handleBeforeunload = (): void => {
    this.raiseCustomEvent('beforeunload');
  };

  public handleError = async (error: Error): Promise<void> => {
    this.raiseCustomEvent('error', error);
  };

  handleLoadMoreHistoryMessages = async (): Promise<void> => {
    this.raiseCustomEvent('acs-adapter-loadnextpage');
  };
}

defineEventAttribute(EventManager.prototype, 'online');
defineEventAttribute(EventManager.prototype, 'offline');
defineEventAttribute(EventManager.prototype, 'error');
defineEventAttribute(EventManager.prototype, 'beforeunload');
defineEventAttribute(EventManager.prototype, 'leavechat');
