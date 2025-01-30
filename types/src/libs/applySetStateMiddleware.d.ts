import { AdapterState, AdapterEnhancer, SetStateFunction } from '../types/AdapterTypes';
import { Middleware } from './internals/createApplyMiddleware';
type SetStateMiddleware<TActivity, TAdapterState extends AdapterState> = Middleware<TActivity, TAdapterState, SetStateFunction<TAdapterState>>;
export default function applySetStateMiddleware<TActivity, TAdapterState extends AdapterState>(...middlewares: SetStateMiddleware<TActivity, TAdapterState>[]): AdapterEnhancer<TActivity, TAdapterState>;
export type { SetStateMiddleware };
//# sourceMappingURL=applySetStateMiddleware.d.ts.map