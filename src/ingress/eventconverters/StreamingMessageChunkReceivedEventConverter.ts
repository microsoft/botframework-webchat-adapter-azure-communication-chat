import { StreamingChatMessageChunkReceivedEvent } from '@azure/communication-chat';
import { GetStateFunction } from '../../types/AdapterTypes';
import { ACSAdapterState } from '../../models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { createStreamingMessageChunkToDirectLineActivityMapper } from '../mappers/createStreamingMessageChunkToDirectLineActivityMapper';
import { LoggerUtils } from '../../utils/LoggerUtils';

/**
 * Converts a `StreamingChatMessageChunkReceivedEvent` into an `ACSDirectLineActivity`.
 *
 * This function processes a streaming message chunk event and maps it to a Direct Line activity
 * using a mapper function. It also logs the event for debugging or monitoring purposes.
 *
 * @param event - The streaming chat message chunk event to be converted.
 * @param getState - A function to retrieve the current state of the ACS adapter.
 * @param existingMessageInCache - A boolean indicating whether the message already exists in the cache.
 *                                  If `true`, the chunk is not the first one; otherwise, it is the first chunk.
 * @returns A promise that resolves to an `ACSDirectLineActivity` if the conversion is successful,
 *          or `void` if no activity is generated.
 */
export const convertStreamingMessageChunkEvent = async (
  event: StreamingChatMessageChunkReceivedEvent,
  getState: GetStateFunction<ACSAdapterState>,
  existingMessageInCache: boolean
): Promise<void | ACSDirectLineActivity> => {
  try {
    const mapper = createStreamingMessageChunkToDirectLineActivityMapper({
      getState,
      isFirstChunk: !existingMessageInCache
    });
    const mapperAction = mapper();
    const activity = await mapperAction(event);
    LoggerUtils.logConvertStreamingMessageChunkEvent(event);
    return activity;
  } catch (error) {
    LoggerUtils.logIngressStreamingChunkFailed(event, getState, error.message ?? '');
  }
};
