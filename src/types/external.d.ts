declare module 'abort-controller-es5' {
  export default class AbortController {
    abort(): void;
    signal: AbortSignal;
  }
}

declare const Microsoft = any;

declare module 'core-js/features/object/entries' {
  export default function entries(map: { [key: string]: any } | any): [[string, any]];
}

declare module 'core-js/features/object/is' {
  export default function is(x: any, y: any): boolean;
}

declare module 'core-js/features/observable' {
  export default class Observable<T> {
    constructor(observerCallback: (observer: Observer<T>) => void);
    subscribe: (subscriber: Subscriber) => Subscription;
  }

  export class Observer<T> {
    complete(): void;
    error(error: Error): void;
    next(value: T): void;
  }

  export type Subscriber<T> = {
    complete(): void;
    error(error: Error): void;
    next(value: T): void;
    start(subscription: Subscription): void;
  };

  export class Subscription {
    unsubscribe(): void;
  }
}

declare module 'event-target-shim-es5' {
  export default class EventTarget {
    addEventListener(name: string, listener: EventListener): void;
    dispatchEvent(event: Event): boolean;
    removeEventListener(name: string, listener: EventListener): void;
  }
  export function defineEventAttribute(prototype: EventTarget, eventName: string): void;
  export type EventListener = (event: Event) => void;
}

declare module 'math-random' {
  export default function random(): number;
}

declare module 'p-defer-es5' {
  export default function createDeferred<T>(): DeferredPromise<T>;

  export type DeferredPromise<T> = {
    promise: Promise<T>;
    reject: (error: Error) => void;
    resolve: (value: T) => void;
  };
}

declare module 'simple-update-in' {
  // eslint-disable-next-line @typescript-eslint/ban-types
  export default function updateIn(target: any, paths: (number | string | Function)[], updater?: Function);
}
