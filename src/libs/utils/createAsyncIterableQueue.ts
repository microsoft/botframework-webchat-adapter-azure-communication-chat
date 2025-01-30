// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/external.d.ts" />

import 'core-js/features/symbol';
import 'core-js/features/async-iterator';

import createDeferred, { DeferredPromise } from 'p-defer';

import is from 'core-js/features/object/is';
import rejectOnAbort from './rejectOnAbort';

export type AsyncIterableQueue<T> = {
  end(): void;
  iterable: AsyncIterable<T>;
  push(value: T): void;
  watermark(): number;
};

export type AsyncIterableQueueOptions = { signal?: AbortSignal };

const END = Symbol();

export default function createAsyncIterableQueue<T>(options: AsyncIterableQueueOptions = {}): AsyncIterableQueue<T> {
  const aborted = rejectOnAbort(options.signal);
  const queue: (T | typeof END)[] = [];

  // Prevent console warning.
  // In some cases, the iterator can stop iterating sooner than the AbortSignal.
  // This will cause the console warning to show up unexpectedly.
  aborted.catch(() => {
    return;
  });

  let started: boolean;
  let nextIterateDeferred: DeferredPromise<void>;

  return {
    iterable: {
      async *[Symbol.asyncIterator]() {
        // This iterator is only called when next() is called.
        // That means, when iterable[Symbol.asyncIterator]().next() is called, this function is called.
        // But not when iterable[Symbol.asyncIterator]() is called.

        if (started) {
          throw new Error(
            'asyncIterableQueue: You can only iterate once. The iteration has already started or finished.'
          );
        }

        started = true;

        for (;;) {
          if (queue.length) {
            // Throw exception immediately when aborted
            await (options.signal && options.signal.aborted && aborted);
          } else {
            await Promise.race([aborted, (nextIterateDeferred || (nextIterateDeferred = createDeferred())).promise]);

            nextIterateDeferred = null;
          }

          const next = queue.shift();

          if (is(next, END)) {
            break;
          }

          yield next as T;
        }
      }
    },

    end() {
      queue.push(END);
    },

    push(value: T) {
      queue.push(value);
      nextIterateDeferred && nextIterateDeferred.resolve();
    },

    watermark() {
      return queue.length;
    }
  };
}
