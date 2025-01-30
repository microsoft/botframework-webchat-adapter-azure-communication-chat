import { AdapterOptions, SealedAdapter } from './types/AdapterTypes';
import createAdapter, { exportDLJSInterface } from './libs';

import { ACSAdapterState } from './models/ACSAdapterState';
import { ChatClient } from '@azure/communication-chat';
import { IDirectLineActivity } from './types/DirectLineTypes';
import { IFileManager } from './types/FileManagerTypes';
import { ILogger } from './log/Logger';
import { compose } from 'redux';
import createACSStoreEnhancer from './createACSStoreEnhancer';
import { IErrorEventSubscriber } from './event/ErrorEventNotifier';

/**
 * Create an ACS Adapter.
 * @param token An ACS user access token.
 * @param id An ACS user id.
 * @param threadId The chat thread id.
 * @param environmentUrl The ACS resource endpoint.
 * @param fileManager An instance of IFileManager.
 * @param displayName User display name.
 * @param logger A logger instance.
 * @param adapterOptions AdapterOptions.
 */
export const createACSAdapter = (
  token: string,
  id: string,
  threadId: string,
  environmentUrl: string,
  fileManager: IFileManager,
  pollingInterval = 30000,
  eventSubscriber?: IErrorEventSubscriber,
  displayName?: string,
  chatClient?: ChatClient,
  logger?: ILogger,
  adapterOptions?: AdapterOptions
): SealedAdapter<IDirectLineActivity, ACSAdapterState> => {
  pollingInterval = pollingInterval >= 5000 ? pollingInterval : 5000;

  return createAdapter(
    adapterOptions,
    compose(
      exportDLJSInterface(),
      createACSStoreEnhancer(
        token,
        id,
        threadId,
        environmentUrl,
        fileManager,
        pollingInterval,
        eventSubscriber,
        displayName,
        chatClient,
        logger,
        adapterOptions
      )
    )
  );
};

export * from './filemanager/OneDriveFileManager';
export * from './log/Logger';
export * from './models/ACSAdapterState';
export * from './models/ACSDirectLineActivity';
export * from './types';
