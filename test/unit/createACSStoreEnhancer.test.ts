import { ACSAdapterState, StateKey } from '../../src/models/ACSAdapterState';

import { ACSDirectLineActivity } from '../../src/models/ACSDirectLineActivity';
import { Adapter } from '../../src/types/AdapterTypes';
import { MockAdapterTemplate } from './mocks/AdapterMock';
import createACSStoreEnhancer from '../../src/createACSStoreEnhancer';
import { MockChatClient, MockChatThreadClient } from './mocks/ChatClientMock';

jest.mock('../../src/sdk/SDKInit', () => ({
  SDKInit: () => {
    return {
      chatClient: MockChatClient(),
      chatThreadClient: MockChatThreadClient()
    };
  }
}));

jest.mock('../../src/sdk/Auth', () => ({
  authConfig: {
    id: 'test',
    environmentUrl: 'test',
    token: 'test'
  }
}));

const emptyFunction = (): any => {
  return;
};

const mockAdapterTemplate = MockAdapterTemplate();
mockAdapterTemplate.subscribe = emptyFunction;

describe('createACSStoreEnhancer tests', () => {
  test('createACSStoreEnhancer should set state as per mock implementation', async (): Promise<void> => {
    const enhancer = await createACSStoreEnhancer(
      'test',
      'test',
      'test',
      'test',
      undefined,
      1000,
      {
        notifyErrorEvent: (adapterErrorEvent) => {
          console.log(adapterErrorEvent);
        }
      },
      'undertest',
      undefined,
      undefined,
      {
        messagePollingHandle: {
          stopPolling: jest.fn(),
          getIsPollingEnabled: jest.fn()
        }
      }
    );
    jest.spyOn(mockAdapterTemplate, 'setState');
    jest.spyOn(mockAdapterTemplate, 'setReadyState');
    const result = await enhancer((): Adapter<ACSDirectLineActivity, ACSAdapterState> => {
      return { ...mockAdapterTemplate };
    })();
    expect(result.activities).toEqual(MockAdapterTemplate().activities);
    expect(mockAdapterTemplate.setState).toHaveBeenCalledTimes(26);
    expect(mockAdapterTemplate.setReadyState).toHaveBeenCalledTimes(1);
    expect(mockAdapterTemplate.setState).toHaveBeenCalledWith(StateKey.UserDisplayName, 'undertest');
    expect(mockAdapterTemplate.setReadyState).toHaveBeenCalledTimes(1);
  });
});
