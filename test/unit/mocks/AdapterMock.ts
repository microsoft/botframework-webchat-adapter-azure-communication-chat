import { Adapter } from '../../../src/types/AdapterTypes';
import { MiddlewareAPI } from '../../../src/types/AdapterTypes';
import { ACSAdapterState } from '../../../src/models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../../src/models/ACSDirectLineActivity';

const emptyFunction = (): any => {
  return;
};

const middlewareMockTemplate: MiddlewareAPI<ACSDirectLineActivity, ACSAdapterState> = {
  close: emptyFunction,
  egress: undefined,
  getReadyState: emptyFunction,
  getState: emptyFunction,
  ingress: undefined,
  setReadyState: emptyFunction,
  setState: emptyFunction,
  subscribe: (subscriber: any) => {
    subscriber.subscribe();
  }
};

export const MockMiddlewareTemplate = (): MiddlewareAPI<ACSDirectLineActivity, ACSAdapterState> => {
  return { ...middlewareMockTemplate };
};

export const MockAdapterTemplate = (): Adapter<ACSDirectLineActivity, ACSAdapterState> => {
  return {
    ...middlewareMockTemplate,
    activities: emptyFunction,
    addEventListener: emptyFunction,
    dispatchEvent: emptyFunction,
    removeEventListener: emptyFunction
  };
};
