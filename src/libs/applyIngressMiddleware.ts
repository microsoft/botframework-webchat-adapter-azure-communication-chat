import { AdapterState, AdapterEnhancer, IngressFunction } from '../types/AdapterTypes';

import createApplyMiddleware, { Middleware } from './internals/createApplyMiddleware';

type IngressMiddleware<TActivity, TAdapterState extends AdapterState> = Middleware<
  TActivity,
  TAdapterState,
  IngressFunction<TActivity>
>;

export default function applyIngressMiddleware<TActivity, TAdapterState extends AdapterState>(
  ...middlewares: IngressMiddleware<TActivity, TAdapterState>[]
): AdapterEnhancer<TActivity, TAdapterState> {
  return createApplyMiddleware<TActivity, TAdapterState, IngressFunction<TActivity>>(
    (api: { ingress: any }) => api.ingress,
    (api: any, fn: any) => ({ ...api, ingress: fn })
  )(...middlewares);
}

export type { IngressMiddleware };
