import { Adapter, AdapterState, SealedAdapter } from '../types/AdapterTypes';

export default function sealAdapter<TActivity, TAdapterState extends AdapterState>(
  adapter: Adapter<TActivity, TAdapterState>,
  config: TAdapterState
): SealedAdapter<TActivity, TAdapterState> {
  const { getReadyState, ...others } = adapter;
  const sealedAdapter = { ...others, readyState: -1 };

  for (const key in config) {
    Object.defineProperty(sealedAdapter, key, {
      enumerable: true,
      get() {
        return config[key];
      }
    });
  }

  Object.defineProperty(sealedAdapter, 'readyState', {
    get() {
      return getReadyState();
    }
  });

  return Object.seal(sealedAdapter) as any;
}
