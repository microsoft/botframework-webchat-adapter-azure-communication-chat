import ConnectivityManager from '../../../src/utils/ConnectivityManager';
import { ChatThreadProperties } from '@azure/communication-chat';
import FakeTimers from '@sinonjs/fake-timers';
import { MockChatClient, MockChatThreadClient } from '../mocks/ChatClientMock';

const mockResponseChatThread: ChatThreadProperties = {
  createdBy: undefined,
  createdOn: undefined,
  id: undefined,
  topic: undefined
};

describe('ConnectivityManager tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('isACSConnected should be able to return true if chatThreadClient returns ChatThreadProperties', async () => {
    const result = await ConnectivityManager.isACSConnected(MockChatClient(), MockChatThreadClient());
    expect(result).toEqual(true);
  });

  test('isACSConnected should be able to return true if chatThreadClient does not return ChatThreadProperties after 1 retry', async () => {
    const spy = jest.spyOn(MockChatThreadClient(), 'getProperties');
    spy
      .mockReturnValue(
        new Promise((resolve) => {
          resolve(mockResponseChatThread);
        })
      )
      .mockReturnValueOnce(
        new Promise((resolve, reject) => {
          reject('first failure');
        })
      );

    const clock = FakeTimers.install();
    const result = ConnectivityManager.isACSConnected(MockChatClient(), MockChatThreadClient());
    await clock.runAllAsync();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(await result).toEqual(true);
    clock.uninstall();
  });

  test('isACSConnected should be able to return false if chatThreadClient does not return ChatThreadProperties after 5 retries', async () => {
    const spy = jest.spyOn(MockChatThreadClient(), 'getProperties');
    spy.mockReturnValue(
      new Promise((_, reject) => {
        reject();
      })
    );
    const clock = FakeTimers.install();
    const result = ConnectivityManager.isACSConnected(MockChatClient(), MockChatThreadClient());
    await clock.tickAsync(32000);
    expect(spy).toHaveBeenCalledTimes(5);
    expect(await result).toEqual(false);
    clock.uninstall();
  });

  test('isACSConnected should be able to return false if chatClient is not initialized', async () => {
    const result = await ConnectivityManager.isACSConnected(undefined, MockChatThreadClient());
    expect(result).toEqual(false);
  });

  test('isACSConnected should be able to return false if chatThreadClient is not initialized', async () => {
    const result = await ConnectivityManager.isACSConnected(MockChatClient(), undefined);
    expect(result).toEqual(false);
  });
});
