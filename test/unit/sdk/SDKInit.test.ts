import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { SDKInit } from '../../../src/sdk/SDKInit';
import { authConfig } from '../../../src/sdk/Auth';
import { config } from '../../../src/sdk/Config';
import { ErrorEventSubscriber } from '../../../src/event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../../../src/types/ErrorEventTypes';
import { LoggerUtils } from '../../../src/utils/LoggerUtils';

jest.mock('@azure/communication-chat');
jest.mock('@azure/communication-common');
jest.mock('../../../src/event/ErrorEventNotifier');

describe('SDKInit', () => {
  const mockId = 'mock-id';
  const mockToken = ' mock-token';
  const mockThreadId = 'mock-thread-id';
  const mockEnvironmentUrl = 'https://mock.environment.url';
  const mockDisplayName = 'mock-display-name';

  const mockChatThreadClient = {} as ChatThreadClient;
  const mockStartRealtimeNotifications = jest.fn().mockResolvedValue(undefined);
  const mockGetChatThreadClient = jest.fn().mockReturnValue(mockChatThreadClient);

  const mockChatClient = {
    getChatThreadClient: mockGetChatThreadClient,
    startRealtimeNotifications: mockStartRealtimeNotifications
  } as unknown as ChatClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(LoggerUtils, 'logSDKStartInit').mockImplementation(jest.fn());
    jest.spyOn(LoggerUtils, 'logSDKStartInitError').mockImplementation(jest.fn());
    jest.spyOn(LoggerUtils, 'logSDKJoinThreadError').mockImplementation(jest.fn());

    (ChatClient as jest.Mock).mockImplementation(() => mockChatClient);
    (AzureCommunicationTokenCredential as jest.Mock).mockImplementation(() => ({}));
    (ErrorEventSubscriber.notifyErrorEvent as jest.Mock).mockImplementation(() => undefined);
  });

  test('should initialize SDK with valid parameters', async () => {
    const result = await SDKInit(mockToken, mockId, mockThreadId, mockEnvironmentUrl, mockDisplayName);

    expect(AzureCommunicationTokenCredential).toHaveBeenCalledWith(mockToken);
    expect(ChatClient).toHaveBeenCalledWith(mockEnvironmentUrl, expect.anything());
    expect(mockGetChatThreadClient).toHaveBeenCalledWith(mockThreadId);
    expect(mockStartRealtimeNotifications).toHaveBeenCalled();
    expect(LoggerUtils.logSDKStartInit).toHaveBeenCalledWith(mockThreadId, mockId);

    expect(authConfig.id).toBe(mockId);
    expect(authConfig.environmentUrl).toBe(mockEnvironmentUrl);
    expect(authConfig.token).toBe(mockToken);
    expect(config.displayName).toBe(mockDisplayName);

    expect(result).toEqual({
      chatClient: mockChatClient,
      chatThreadClient: mockChatThreadClient
    });
  });

  test('should use existing chatClient if provided', async () => {
    const customChatClient = {
      getChatThreadClient: mockGetChatThreadClient,
      startRealtimeNotifications: mockStartRealtimeNotifications
    } as unknown as ChatClient;

    await SDKInit(mockToken, mockId, mockThreadId, mockEnvironmentUrl, mockDisplayName, customChatClient);

    expect(ChatClient).not.toHaveBeenCalled();
    expect(mockGetChatThreadClient).toHaveBeenCalledWith(mockThreadId);
  });

  test('should handle missing token', async () => {
    await SDKInit('', mockId, mockThreadId, mockEnvironmentUrl);

    expect(ErrorEventSubscriber.notifyErrorEvent).toHaveBeenCalledWith({
      ErrorType: AdapterErrorEventType.ADAPTER_INIT_TOKEN_MISSING_ERROR,
      Timestamp: expect.any(String),
      AcsChatDetails: {
        ThreadId: mockThreadId,
        RequesterUserId: mockId
      }
    });
    expect(LoggerUtils.logSDKStartInitError).toHaveBeenCalled();
  });

  test('should handle missing threadId', async () => {
    await SDKInit(mockToken, mockId, '', mockEnvironmentUrl);

    expect(ErrorEventSubscriber.notifyErrorEvent).toHaveBeenCalledWith({
      ErrorType: AdapterErrorEventType.ADAPTER_INIT_THREAD_ID_MISSING_ERROR,
      Timestamp: expect.any(String),
      AcsChatDetails: {
        RequesterUserId: mockId
      }
    });
    expect(LoggerUtils.logSDKStartInitError).toHaveBeenCalled();
  });

  test('should log error when chatThreadClient is undefined', async () => {
    mockGetChatThreadClient.mockReturnValueOnce(undefined);

    await SDKInit(mockToken, mockId, mockThreadId, mockEnvironmentUrl);

    expect(LoggerUtils.logSDKJoinThreadError).toHaveBeenCalled();
  });

  test('should handle exceptions', async () => {
    interface ExtendedError extends Error {
      details?: string;
      request?: {
        headers: Map<string, string>;
      };
    }
    const mockError = new Error('Test error') as ExtendedError;
    mockError['details'] = 'Error details';
    mockError['request'] = { headers: new Map([['ms-cv', 'correlation-id']]) };

    mockStartRealtimeNotifications.mockRejectedValueOnce(mockError);

    await SDKInit(mockToken, mockId, mockThreadId, mockEnvironmentUrl);

    expect(ErrorEventSubscriber.notifyErrorEvent).toHaveBeenCalledWith({
      ErrorType: AdapterErrorEventType.ADAPTER_INIT_EXCEPTION,
      ErrorMessage: 'Test error',
      ErrorStack: expect.any(String),
      ErrorDetails: 'Error details',
      Timestamp: expect.any(String),
      AcsChatDetails: {
        RequesterUserId: mockId,
        ThreadId: mockId
      },
      CorrelationVector: 'correlation-id'
    });
    expect(LoggerUtils.logSDKStartInitError).toHaveBeenCalled();
  });
});
