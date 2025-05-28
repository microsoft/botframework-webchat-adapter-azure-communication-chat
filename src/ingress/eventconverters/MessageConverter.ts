import { ChatMessageDeletedEvent, ChatMessageEditedEvent } from '@azure/communication-chat';
import createEditedMessageToDirectLineActivityMapper from '../mappers/createEditedMessageToDirectLineActivityMapper';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { GetStateFunction } from '../../types';
import {
  logConvertDeletedMessageEvent,
  logConvertEditedMessageEvent,
  logDeletedMessageEventIngressFailed,
  logEditEventIngressFailed
} from '../../utils/LoggerUtils';
import { ACSAdapterState } from '../..';
import createDeletedMessageEventToDirectLineActivityMapper from '../mappers/createDeletedMessageEventToDirectLineActivityMapper';

export const convertEditedMessageEvent = async (
  event: ChatMessageEditedEvent,
  getState: GetStateFunction<ACSAdapterState>
): Promise<void | ACSDirectLineActivity> => {
  try {
    const activity = await createEditedMessageToDirectLineActivityMapper({ getState })()(event);
    logConvertEditedMessageEvent(event);
    return activity;
  } catch (error) {
    logEditEventIngressFailed(event, error.message, getState);
  }
};

export const convertDeletedMessageEvent = async (
  event: ChatMessageDeletedEvent,
  getState: GetStateFunction<ACSAdapterState>
): Promise<void | ACSDirectLineActivity> => {
  try {
    const activity = await createDeletedMessageEventToDirectLineActivityMapper({ getState })()(event);
    logConvertDeletedMessageEvent(event);
    return activity;
  } catch (error) {
    logDeletedMessageEventIngressFailed(event, error.message, getState);
  }
};
