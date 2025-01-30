import { Adapter, ReadyState } from '../types/AdapterTypes';
import { compose } from 'redux';
import applyEgressMiddleware from './applyEgressMiddleware';
import applyIngressMiddleware from './applyIngressMiddleware';
import applySetStateMiddleware from './applySetStateMiddleware';
import applySubscribeMiddleware from './applySubscribeMiddleware';
import createAdapter from './createAdapter';
import exportDLJSInterface from './enhancers/exportDLJSInterface';
export default createAdapter;
declare const CLOSED: ReadyState, CONNECTING: ReadyState, OPEN: ReadyState;
export { applyEgressMiddleware, applyIngressMiddleware, applySetStateMiddleware, applySubscribeMiddleware, CLOSED, compose, CONNECTING, exportDLJSInterface, OPEN };
export type { Adapter };
//# sourceMappingURL=index.d.ts.map