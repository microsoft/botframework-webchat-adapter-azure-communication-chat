import Observable from 'core-js/features/observable';
import { ACSDirectLineActivity, ACSAdapterState } from '..';
import { EgressMiddleware } from '../libs/applyEgressMiddleware';
import { IMessagePollingHandle } from './MessagePollingTypes';
interface AdapterOptions {
    enableAdaptiveCards?: boolean;
    enableThreadMemberUpdateNotification?: boolean;
    enableLeaveThreadOnWindowClosed?: boolean;
    enableSenderDisplayNameInTypingNotification?: boolean;
    enableMessageErrorHandler?: boolean;
    historyPageSizeLimit?: number | undefined;
    serverPageSizeLimit?: number | undefined;
    webChatInitTimeout?: number;
    shouldFileAttachmentDownloadTimeout?: boolean;
    fileAttachmentDownloadTimeout?: number;
    egressMiddleware?: EgressMiddleware<ACSDirectLineActivity, ACSAdapterState>[];
    ingressMiddleware?: EgressMiddleware<ACSDirectLineActivity, ACSAdapterState>[];
    messagePollingHandle?: IMessagePollingHandle;
}
declare enum ReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSED = 2
}
type IterateActivitiesOptions = {
    signal?: AbortSignal;
};
type AdapterState = {
    [key: string]: any;
};
type SealedAdapter<TActivity, TAdapterState extends AdapterState> = {
    activities: (options?: IterateActivitiesOptions) => AsyncIterable<TActivity>;
    close: () => void;
    egress: EgressFunction<TActivity>;
    ingress: IngressFunction<TActivity>;
    readyState: ReadyState;
    subscribe: SubscribeFunction<TActivity>;
} & EventTarget & TAdapterState;
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
type AdapterCreator<TActivity, TAdapterState extends AdapterState> = (options?: AdapterOptions | any) => Adapter<TActivity, TAdapterState>;
type AdapterEnhancer<TActivity, TAdapterState extends AdapterState> = (next: AdapterCreator<TActivity, TAdapterState>) => AdapterCreator<TActivity, TAdapterState>;
type ChatEqualityFields = {
    createdOn: Date;
    updatedOn?: Date;
    deletedOn?: Date;
    content: string;
    fileIds?: string[];
};
export type { Adapter, AdapterCreator, AdapterEnhancer, AdapterOptions, AdapterState, ChatEqualityFields, EgressFunction, EgressOptions, GetStateFunction, IngressFunction, IterateActivitiesOptions, MiddlewareAPI, SealedAdapter, SetStateFunction, SubscribeFunction };
export { ReadyState };
//# sourceMappingURL=AdapterTypes.d.ts.map