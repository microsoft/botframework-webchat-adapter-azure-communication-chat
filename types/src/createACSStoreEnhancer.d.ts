import { ACSAdapterState } from './models/ACSAdapterState';
import { AdapterEnhancer } from './types/AdapterTypes';
import { ILogger } from './log/Logger';
import { ACSDirectLineActivity } from './models/ACSDirectLineActivity';
import { AdapterOptions } from './types/AdapterTypes';
import { ChatClient } from '@azure/communication-chat';
import { IFileManager } from './types/FileManagerTypes';
import { IErrorEventSubscriber } from './event/ErrorEventNotifier';
export default function createACSStoreEnhancer(token: string, id: string, threadId: string, environmentUrl: string, fileManager: IFileManager, pollingInterval: number, eventSubscriber: IErrorEventSubscriber, displayName?: string, chatClient?: ChatClient, logger?: ILogger, adapterOptions?: AdapterOptions): AdapterEnhancer<ACSDirectLineActivity, ACSAdapterState>;
//# sourceMappingURL=createACSStoreEnhancer.d.ts.map