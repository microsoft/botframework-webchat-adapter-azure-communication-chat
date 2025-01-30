import { AdapterEnhancer, AdapterOptions } from '../types/AdapterTypes';

import { ACSAdapterState } from '../models/ACSAdapterState';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { applyEgressMiddleware } from '../libs';
import createEgressFileAttachmentMiddleware from './createEgressFileAttachmentMiddleware';
import createEgressMessageActivityMiddleware from './createEgressMessageActivityMiddleware';
import createEgressTypingActivityMiddleware from './createEgressTypingActivityMiddleware';

export default function createEgressEnhancer(
  adapterOptions?: AdapterOptions
): AdapterEnhancer<ACSDirectLineActivity, ACSAdapterState> {
  const egressMiddleware = adapterOptions && adapterOptions.egressMiddleware ? adapterOptions.egressMiddleware : [];
  return applyEgressMiddleware(
    ...egressMiddleware,
    createEgressFileAttachmentMiddleware(),
    createEgressMessageActivityMiddleware(),
    createEgressTypingActivityMiddleware()
  );
}
