import FakeTimers from '@sinonjs/fake-timers';
import createSubscribeNewMessageAndThreadUpdateEnhancer from '../../../src/ingress/subscribeNewMessageAndThreadUpdate';
import { Adapter } from '../../../src/libs';
import { ACSAdapterState, StateKey } from '../../../src/models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../../src/models/ACSDirectLineActivity';
import { MockAdapterTemplate } from '../mocks/AdapterMock';
import { MockChatClient } from '../mocks/ChatClientMock';
import { IMessagePollingHandle, MessagePollingHandle } from '../../../src/types/MessagePollingTypes';

const chatClientMock = MockChatClient();

const chatThreadClientMock = {
  listMessages: () => ({
    next: () => ({
      done: true
    }),
    byPage: () => ({
      next: () => ({
        done: true
      })
    })
  })
};

const next = jest.fn();
const chatThreadClient = {
  listMessages: jest.fn()
};

let startDate: any;
const eventManager: any = {
  addEventListener: jest.fn()
};

const mockMessagePollHandler: IMessagePollingHandle = {
  stopPolling: () => false,
  getIsPollingEnabled: () => true
};

const defaultMessagePollHandler = new MessagePollingHandle(undefined);
let setDefaultMessagePollingHandler = true;

let enableLeaveThreadOnWindowClosed: boolean;
let enableThreadMemberUpdateNotification: boolean;
const adapterTemplateMock = MockAdapterTemplate();
adapterTemplateMock.getState = (key: StateKey) => {
  if (key === StateKey.ChatClient) {
    return chatClientMock;
  }
  if (key === StateKey.DisconnectUTC) {
    return startDate;
  }
  if (key === StateKey.ChatThreadClient) {
    return chatThreadClient;
  }
  if (key === StateKey.EventManager) {
    return eventManager;
  }
  if (key === StateKey.AdapterOptions) {
    return {
      enableLeaveThreadOnWindowClosed,
      enableThreadMemberUpdateNotification
    };
  }
  if (key === StateKey.MessagePollingHandleInstance) {
    if (setDefaultMessagePollingHandler) {
      return defaultMessagePollHandler;
    } else {
      return mockMessagePollHandler;
    }
  }
};

const nextAdapterCreator = (): Adapter<ACSDirectLineActivity, ACSAdapterState> => adapterTemplateMock;

describe('subscribeNewMessageAndThreadUpdate tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be able to call chatClient on 9 times when enableThreadMemberUpdateNotification is true after calling createSubscribeNewMessageAndThreadUpdateEnhancer', async () => {
    enableThreadMemberUpdateNotification = true;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(chatClientMock.on).toHaveBeenCalledTimes(10);
  });

  test('should be able to call chatClient on 7 times when enableThreadMemberUpdateNotification is false after calling createSubscribeNewMessageAndThreadUpdateEnhancer', async () => {
    enableThreadMemberUpdateNotification = false;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(chatClientMock.on).toHaveBeenCalledTimes(8);
  });

  test('eventManager addEventListener is initialized(online, beforeunload, handleclose, attachment download) when ChatThreadClient key is set & enableLeaveThreadOnWindowClosed is true', async () => {
    enableLeaveThreadOnWindowClosed = true;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(eventManager.addEventListener).toHaveBeenCalledTimes(7);
  });

  test('eventManager addEventListener is initialized(online, beforeunload, handleclose, attachment download) when ChatThreadClient & enableLeaveThreadOnWindowClosed key is set & enableLeaveThreadOnWindowClosed is false', async () => {
    enableLeaveThreadOnWindowClosed = false;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(eventManager.addEventListener).toHaveBeenCalledTimes(6);
  });

  test('listMessages is called when client polling setting is true', async () => {
    setDefaultMessagePollingHandler = false;
    mockMessagePollHandler.getIsPollingEnabled = () => true;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    jest.spyOn(chatThreadClientMock, 'listMessages');
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(chatThreadClientMock.listMessages).toHaveBeenCalled();
  });

  test('listMessages is called again when client polling setting is true and polling timer is invoked', async () => {
    setDefaultMessagePollingHandler = true;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    jest.spyOn(chatThreadClientMock, 'listMessages');
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(chatThreadClientMock.listMessages).toHaveBeenCalled();
    const clock = FakeTimers.install();
    await clock.tickAsync(17000);
    // since there is a polling call every second, list messages will be called 18 times
    expect(chatThreadClientMock.listMessages).toHaveBeenCalledTimes(18);
    clock.uninstall();
  });

  test('listMessages is not called again when client polling setting is true but client stops poll and polling timer is invoked', async () => {
    setDefaultMessagePollingHandler = false;
    mockMessagePollHandler.stopPolling = () => true;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    jest.spyOn(chatThreadClientMock, 'listMessages');
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);

    expect(chatThreadClientMock.listMessages).toHaveBeenCalled();
    const clock = FakeTimers.install();
    await clock.tickAsync(1000); // because of fast polling next call will be after 1 sec.
    expect(chatThreadClientMock.listMessages).toHaveBeenCalledTimes(1);
    clock.uninstall();
  });

  test('listMessages is called again when client polling setting is true but client keeps poll true and polling timer is invoked', async () => {
    setDefaultMessagePollingHandler = false;
    mockMessagePollHandler.stopPolling = () => false;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    jest.spyOn(chatThreadClientMock, 'listMessages');
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(chatThreadClientMock.listMessages).toHaveBeenCalled();
    const clock = FakeTimers.install();
    await clock.tickAsync(1000); // because of fast polling next call will be after 1 sec.
    expect(chatThreadClientMock.listMessages).toHaveBeenCalledTimes(2);
    clock.uninstall();
  });

  test('listMessages is called when client polling setting is not set', async () => {
    setDefaultMessagePollingHandler = true;
    const adapter = createSubscribeNewMessageAndThreadUpdateEnhancer()(nextAdapterCreator)(next);
    jest.spyOn(chatThreadClientMock, 'listMessages');
    adapter.setState(StateKey.ChatThreadClient, chatThreadClientMock);
    expect(chatThreadClientMock.listMessages).toHaveBeenCalled();
  });
});
