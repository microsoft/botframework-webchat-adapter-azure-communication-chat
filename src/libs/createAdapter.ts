// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../types/external.d.ts" />

import {
  Adapter,
  AdapterEnhancer,
  AdapterOptions,
  AdapterState,
  ReadyState,
  SealedAdapter
} from '../types/AdapterTypes';
import Observable, { Subscription } from 'core-js/features/observable';
import createAsyncIterableQueue, { AsyncIterableQueue } from './utils/createAsyncIterableQueue';

import EventTarget, { Event } from 'event-target-shim';
import sealAdapter from './sealAdapter';

const DEFAULT_ENHANCER: AdapterEnhancer<any, any> = (next) => (options) => next(options);

export default function createAdapter<TActivity, TAdapterState extends AdapterState>(
  options: AdapterOptions = {},
  enhancer: AdapterEnhancer<TActivity, TAdapterState> = DEFAULT_ENHANCER
): SealedAdapter<TActivity, TAdapterState> {
  const mutableAdapterState: TAdapterState = {} as TAdapterState;
  let sealed = false;
  let activeSubscription: Subscription;

  const adapter = enhancer((): Adapter<TActivity, TAdapterState> => {
    const eventTarget = new EventTarget();
    const ingressQueues: AsyncIterableQueue<TActivity>[] = [];
    let readyStatePropertyValue = ReadyState.CONNECTING;

    return {
      addEventListener: eventTarget.addEventListener.bind(eventTarget),
      dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
      removeEventListener: eventTarget.removeEventListener.bind(eventTarget),

      activities: ({ signal } = {}): AsyncIterable<TActivity> => {
        const queue = createAsyncIterableQueue<TActivity>({ signal });

        ingressQueues.push(queue);

        if (signal) {
          signal.addEventListener('abort', () => {
            const index = ingressQueues.indexOf(queue);
            if (index !== -1) {
              ingressQueues.splice(index, 1);
            }
          });
        }
        return queue.iterable;
      },

      close: () => {
        ingressQueues.forEach((ingressQueue) => ingressQueue.end());
        ingressQueues.splice(0, Infinity);

        if (activeSubscription) { activeSubscription.unsubscribe(); }
        activeSubscription = null;
      },

      // Egress middleware API
      egress: (): Promise<void> => {
        return Promise.resolve();
      },

      getState: (name: keyof TAdapterState) => {
        return mutableAdapterState[name];
      },

      getReadyState: () => readyStatePropertyValue,

      // Ingress middleware API
      ingress: (activity) => {
        ingressQueues.forEach((ingressQueue) => ingressQueue.push(activity));
      },

      setState: (name: keyof TAdapterState, value: any) => {
        if (sealed && !(name in mutableAdapterState)) {
          throw new Error(`Cannot set config "${String(name)}" because it was not set before being sealed.`);
        }

        // TODO: Fix this typing
        // mutableAdapterState[name] = value;
        (mutableAdapterState as any)[name] = value;
      },

      setReadyState: (readyState: ReadyState) => {
        if (readyState === readyStatePropertyValue) {
          return;
        }

        if (readyStatePropertyValue === ReadyState.CLOSED) {
          throw new Error('Cannot change "readyState" after it is CLOSED.');
        } else if (
          readyState !== ReadyState.CLOSED &&
          readyState !== ReadyState.CONNECTING &&
          readyState !== ReadyState.OPEN
        ) {
          throw new Error('"readyState" must be either CLOSED, CONNECTING or OPEN.');
        }

        readyStatePropertyValue = readyState;

        if (readyState === ReadyState.CLOSED) {
          if (activeSubscription) {activeSubscription.unsubscribe();}
          activeSubscription = null;
        }

        eventTarget.dispatchEvent(new Event(readyState === ReadyState.OPEN ? 'open' : 'error'));
      },

      subscribe: (observable: Observable<TActivity> | false) => {
        if (activeSubscription) { activeSubscription.unsubscribe();}
        activeSubscription = null;

        if (!observable) {
          return;
        }

        let subscription: Subscription;

        observable.subscribe({
          start(thisSubscription: Subscription) {
            activeSubscription = thisSubscription;
            subscription = thisSubscription;
          },

          complete() {
            if (activeSubscription === subscription) {
              activeSubscription = null;
            }
          },

          error() {
            if (activeSubscription === subscription) {
              activeSubscription = null;
            }

            // TODO: Propagate the error to fail the adapter.
            // ingressQueues.forEach(ingressQueue => ingressQueue.push(error));
          },

          next(value: TActivity) {
            adapter.ingress(value);
          }
        });
      }
    };
  })(options);

  if (Object.getPrototypeOf(adapter) !== Object.prototype) {
    throw new Error('Object returned from enhancer must not be a class object.');
  }

  const sealedAdapter = sealAdapter(adapter, mutableAdapterState);

  sealed = true;

  return sealedAdapter;
}
