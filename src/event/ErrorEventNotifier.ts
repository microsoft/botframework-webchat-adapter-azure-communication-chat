import { AdapterErrorEventType } from '../types/ErrorEventTypes';

export interface AdapterErrorEvent {
  StatusCode?: number;
  ErrorType: AdapterErrorEventType;
  ErrorMessage?: string;
  ErrorStack?: string;
  ErrorDetails?: any;
  Timestamp: string;
  CorrelationVector?: string;
  AcsChatDetails?: AcsChatDetails;
  AdditionalParams?: any;
}

export interface AcsChatDetails {
  RequesterUserId?: string;
  MessageSenderId?: string;
  ThreadId?: string;
  MessageId?: string;
}

export interface IErrorEventSubscriber {
  notifyErrorEvent(adapterErrorEvent: AdapterErrorEvent): void;
}

interface IAdapterErrorEventSubscriber extends IErrorEventSubscriber {
  setInstance(errorEventSubscriber: IErrorEventSubscriber): void;
  errorEventSubscriberInstance: IErrorEventSubscriber;
}

export const ErrorEventSubscriber: IAdapterErrorEventSubscriber = {
  errorEventSubscriberInstance: undefined,
  setInstance: (logger: IErrorEventSubscriber) => {
    ErrorEventSubscriber.errorEventSubscriberInstance = logger;
  },
  notifyErrorEvent: (adapterErrorEvent: AdapterErrorEvent) => {
    if (ErrorEventSubscriber.errorEventSubscriberInstance !== undefined) {
      ErrorEventSubscriber.errorEventSubscriberInstance.notifyErrorEvent(adapterErrorEvent);
    }
  }
};
