import EventManager from '../../../src/utils/EventManager';

describe('Event Manager tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('raiseCustomEvent(online) is triggered if isACSConnected is true', async () => {
    const eventManager = new EventManager();
    jest.spyOn(eventManager, 'dispatchEvent');
    await eventManager.handleOnline();
    expect(eventManager.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('handleOffline calls raiseCustomEvent', async () => {
    const eventManager = new EventManager();
    jest.spyOn(eventManager, 'dispatchEvent');
    eventManager.handleOffline();
    expect(eventManager.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('handleAcsChatOnline calls raiseCustomEvent', async () => {
    const eventManager = new EventManager();
    jest.spyOn(eventManager, 'dispatchEvent');
    eventManager.handleAcsChatOnline();
    expect(eventManager.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('handleError calls raiseCustomEvent', async () => {
    const eventManager = new EventManager();
    jest.spyOn(eventManager, 'dispatchEvent');
    eventManager.handleOffline();
    expect(eventManager.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('leavechat calls raiseCustomEvent', async () => {
    const eventManager = new EventManager();
    jest.spyOn(eventManager, 'dispatchEvent');
    eventManager.handleLeaveChat();
    expect(eventManager.dispatchEvent).toHaveBeenCalledTimes(1);
  });

  test('ACSLoadNextPage calls raiseCustomEvent', async () => {
    const eventManager = new EventManager();
    jest.spyOn(eventManager, 'dispatchEvent');
    eventManager.handleLoadMoreHistoryMessages();
    expect(eventManager.dispatchEvent).toHaveBeenCalledTimes(1);
  });
});
