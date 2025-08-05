import { StreamingChatMessageChunkReceivedEvent } from '@azure/communication-chat';
import { convertStreamingMessageChunkEvent } from '../../../../src/ingress/eventconverters/StreamingMessageChunkReceivedEventConverter';
import { createStreamingMessageChunkToDirectLineActivityMapper } from '../../../../src/ingress/mappers/createStreamingMessageChunkToDirectLineActivityMapper';
import { ACSDirectLineActivity } from '../../../../src/models/ACSDirectLineActivity';
import { GetStateFunction } from '../../../../src/types/AdapterTypes';
import { ACSAdapterState } from '../../../../src/models/ACSAdapterState';

// Mock dependencies
jest.mock('../../../../src/ingress/mappers/createStreamingMessageChunkToDirectLineActivityMapper');

describe('convertStreamingMessageChunkEvent', () => {
  // Test variables
  const mockEvent: StreamingChatMessageChunkReceivedEvent = {
    id: 'test-id',
    sender: { communicationUserId: 'user-id2', kind: 'communicationUser' },
    editedOn: new Date(),
    message: 'Test',
    version: '1',
    type: 'test',
    threadId: 'testThreadId',
    senderDisplayName: 'SenderName',
    recipient: { communicationUserId: 'user-id', kind: 'communicationUser' },
    metadata: {},
    createdOn: new Date()
  };
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
    expect(result).toEqual(mockActivity);
  });

  test('should return undefined when mapper returns undefined', async () => {
    mockMapperAction.mockResolvedValueOnce(undefined);
    const existingMessageInCache = false;

    const result = await convertStreamingMessageChunkEvent(mockEvent, mockGetState, existingMessageInCache);

    expect(result).toBeUndefined();
  });
});
