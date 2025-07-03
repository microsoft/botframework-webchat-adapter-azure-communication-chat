import Observable from 'core-js/features/observable';
import { ACSDirectLineActivity, ACSAdapterState } from '..';
import { EgressMiddleware } from '../libs/applyEgressMiddleware';
import { IMessagePollingHandle } from './MessagePollingTypes';
import { ChatParticipant } from '@azure/communication-chat';

interface AdapterOptions {
  enableAdaptiveCards?: boolean; // Whether to enable adaptive card payload in adapter(which will convert content payload into a json string)
  enableAdaptiveCardsResponses?: boolean; // Whether to enable adaptive card responses when translating ACS messages and RTN to activities. Default is true.
  enableThreadMemberUpdateNotification?: boolean; // Whether to enable chat thread member join/leave notification
  enableLeaveThreadOnWindowClosed?: boolean; // Whether to remove user on browser close event
  enableSenderDisplayNameInTypingNotification?: boolean; // Whether to send sender display name in typing notification
  enableMessageErrorHandler?: boolean; // Whether to enable error handler to handle failed messages.
  historyPageSizeLimit?: number | undefined; // History messages's size limit per page. Off by default if no size limit provided
  serverPageSizeLimit?: number | undefined; // Message limit to request to server at once.
  webChatInitTimeout?: number; // Timeout to let WebChat subscribe to connection status changes. Default will be 2000
  shouldFileAttachmentDownloadTimeout?: boolean; // Whether file attachment should wait for default fetch timeout or configured timeout
  fileAttachmentDownloadTimeout?: number; // Timeout value for file attachment download. If previous boolean is set to true then default value will be 90000 ms
  egressMiddleware?: EgressMiddleware<ACSDirectLineActivity, ACSAdapterState>[];
  ingressMiddleware?: EgressMiddleware<ACSDirectLineActivity, ACSAdapterState>[];
  messagePollingHandle?: IMessagePollingHandle;
}

enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSED = 2
}

type IterateActivitiesOptions = {
  signal?: AbortSignal;
};

type AdapterState = { [key: string]: any };

type SealedAdapter<TActivity, TAdapterState extends AdapterState> = {
  activities: (options?: IterateActivitiesOptions) => AsyncIterable<TActivity>;
  close: () => void;
  egress: EgressFunction<TActivity>;
  ingress: IngressFunction<TActivity>;
  readyState: ReadyState;
  subscribe: SubscribeFunction<TActivity>;
} & EventTarget &
  TAdapterState;

interface Adapter<TActivity, TAdapterState extends AdapterState> extends EventTarget {
  activities: (options?: IterateActivitiesOptions) => AsyncIterable<TActivity>;
  close: () => void;
  egress: EgressFunction<TActivity>;
  getState: GetStateFunction<TAdapterState>;
  getReadyState: () => ReadyState;
  ingress: IngressFunction<TActivity>;
  setReadyState: (readyState: ReadyState) => void;
  setState: SetStateFunction<TAdapterState>;
  subscribe: SubscribeFunction<TActivity>;
}

interface MiddlewareAPI<TActivity, TAdapterState extends AdapterState> {
  close: () => void;
  egress: EgressFunction<TActivity>;
  getReadyState: () => ReadyState;
  getState: GetStateFunction<TAdapterState>;
  ingress: IngressFunction<TActivity>;
  setReadyState: (readyState: ReadyState) => void;
  setState: SetStateFunction<TAdapterState>;
  subscribe: SubscribeFunction<TActivity>;
}

type EgressOptions<TActivity> = {
  progress: (activity: TActivity) => void;
};

type EgressFunction<TActivity> = (activity: TActivity, options?: EgressOptions<TActivity>) => Promise<void> | void;
type GetStateFunction<TAdapterState> = (key: keyof TAdapterState) => any;
type IngressFunction<TActivity> = (activity: TActivity) => void;
type SetStateFunction<TAdapterState> = (key: keyof TAdapterState, value: any) => void;
type SubscribeFunction<TActivity> = (observable: Observable<TActivity> | false) => void;

type AdapterCreator<TActivity, TAdapterState extends AdapterState> = (
  options?: AdapterOptions | any
) => Adapter<TActivity, TAdapterState>;

type AdapterEnhancer<TActivity, TAdapterState extends AdapterState> = (
  next: AdapterCreator<TActivity, TAdapterState>
) => AdapterCreator<TActivity, TAdapterState>;

type ChatEqualityFields = {
  updatedOn?: Date;
  deletedOn?: Date;
  content?: string;
  fileIds?: string[];
  addedParticipants?: ChatParticipant[];
  removedParticipants?: ChatParticipant[];
};

export type {
  Adapter,
  AdapterCreator,
  AdapterEnhancer,
  AdapterOptions,
  AdapterState,
  ChatEqualityFields,
  EgressFunction,
  EgressOptions,
  GetStateFunction,
  IngressFunction,
  IterateActivitiesOptions,
  MiddlewareAPI,
  SealedAdapter,
  SetStateFunction,
  SubscribeFunction
};

export { ReadyState };
