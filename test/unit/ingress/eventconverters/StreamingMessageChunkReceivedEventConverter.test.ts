import { StreamingChatMessageChunkReceivedEvent } from '@azure/communication-chat';
import { convertStreamingMessageChunkEvent } from '../../../../src/ingress/eventconverters/StreamingMessageChunkReceivedEventConverter';
import { createStreamingMessageChunkToDirectLineActivityMapper } from '../../../../src/ingress/mappers/createStreamingMessageChunkToDirectLineActivityMapper';
import { logConvertStreamingMessageChunkEvent } from '../../../../src/utils/LoggerUtils';
import { ACSDirectLineActivity } from '../../../../src/models/ACSDirectLineActivity';
import { GetStateFunction } from '../../../../src/types/AdapterTypes';
import { ACSAdapterState } from '../../../../src/models/ACSAdapterState';

// Mock dependencies
jest.mock('../../../../src/ingress/mappers/createStreamingMessageChunkToDirectLineActivityMapper');
jest.mock('../../../../src/utils/LoggerUtils');

describe('convertStreamingMessageChunkEvent', () => {
  // Test variables
  const mockEvent = { id: 'test-id' } as unknown as StreamingChatMessageChunkReceivedEvent;
  const mockGetState = jest.fn() as GetStateFunction<ACSAdapterState>;
  const mockActivity = { type: 'message' } as unknown as ACSDirectLineActivity;
  const mockMapperAction = jest.fn().mockResolvedValue(mockActivity);
  const mockMapper = jest.fn().mockReturnValue(mockMapperAction);

  beforeEach(() => {
    jest.clearAllMocks();
    (createStreamingMessageChunkToDirectLineActivityMapper as jest.Mock).mockReturnValue(mockMapper);
  });

  test('should process first chunk correctly when existingMessageInCache is false', async () => {
    const existingMessageInCache = false;

    const result = await convertStreamingMessageChunkEvent(mockEvent, mockGetState, existingMessageInCache);

    expect(createStreamingMessageChunkToDirectLineActivityMapper).toHaveBeenCalledWith({
      getState: mockGetState,
      isFirstChunk: true // Should be true when existingMessageInCache is false
    });
    expect(mockMapper).toHaveBeenCalled();
    expect(mockMapperAction).toHaveBeenCalledWith(mockEvent);
    expect(logConvertStreamingMessageChunkEvent).toHaveBeenCalledWith(mockEvent);
    expect(result).toEqual(mockActivity);
  });

  test('should process subsequent chunk correctly when existingMessageInCache is true', async () => {
    const existingMessageInCache = true;

    const result = await convertStreamingMessageChunkEvent(mockEvent, mockGetState, existingMessageInCache);

    expect(createStreamingMessageChunkToDirectLineActivityMapper).toHaveBeenCalledWith({
      getState: mockGetState,
      isFirstChunk: false // Should be false when existingMessageInCache is true
    });
    expect(mockMapper).toHaveBeenCalled();
    expect(mockMapperAction).toHaveBeenCalledWith(mockEvent);
    expect(logConvertStreamingMessageChunkEvent).toHaveBeenCalledWith(mockEvent);
    expect(result).toEqual(mockActivity);
  });

  test('should return undefined when mapper returns undefined', async () => {
    mockMapperAction.mockResolvedValueOnce(undefined);
    const existingMessageInCache = false;

    const result = await convertStreamingMessageChunkEvent(mockEvent, mockGetState, existingMessageInCache);

    expect(result).toBeUndefined();
    expect(logConvertStreamingMessageChunkEvent).toHaveBeenCalledWith(mockEvent);
  });
});
