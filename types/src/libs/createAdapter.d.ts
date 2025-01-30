/// <reference path="../../../src/types/external.d.ts" />
import { AdapterEnhancer, AdapterOptions, AdapterState, SealedAdapter } from '../types/AdapterTypes';
export default function createAdapter<TActivity, TAdapterState extends AdapterState>(options?: AdapterOptions, enhancer?: AdapterEnhancer<TActivity, TAdapterState>): SealedAdapter<TActivity, TAdapterState>;
//# sourceMappingURL=createAdapter.d.ts.map