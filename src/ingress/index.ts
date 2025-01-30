import { AdapterEnhancer, AdapterOptions } from '../types/AdapterTypes';

import { ACSAdapterState } from '../models/ACSAdapterState';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { applyIngressMiddleware } from '../libs';
import { compose } from 'redux';
import createSubscribeNewMessageAndThreadUpdateEnhancer from './subscribeNewMessageAndThreadUpdate';

export default function createIngressEnhancer(
  adapterOptions?: AdapterOptions
): AdapterEnhancer<ACSDirectLineActivity, ACSAdapterState> {
  const ingressMiddleware = adapterOptions && adapterOptions.ingressMiddleware ? adapterOptions.ingressMiddleware : [];
  return compose(applyIngressMiddleware(...ingressMiddleware), createSubscribeNewMessageAndThreadUpdateEnhancer());
}
