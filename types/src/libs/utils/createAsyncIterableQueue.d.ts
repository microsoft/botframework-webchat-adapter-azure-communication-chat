/// <reference path="../../../../src/types/external.d.ts" />
import 'core-js/features/symbol';
import 'core-js/features/async-iterator';
export type AsyncIterableQueue<T> = {
    end(): void;
    iterable: AsyncIterable<T>;
    push(value: T): void;
    watermark(): number;
};
export type AsyncIterableQueueOptions = {
    signal?: AbortSignal;
};
export default function createAsyncIterableQueue<T>(options?: AsyncIterableQueueOptions): AsyncIterableQueue<T>;
//# sourceMappingURL=createAsyncIterableQueue.d.ts.map