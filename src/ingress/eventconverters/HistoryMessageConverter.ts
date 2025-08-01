import { ChatMessage } from '@azure/communication-chat';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { LoggerUtils } from '../../utils/LoggerUtils';
import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { GetStateFunction } from '../../types/AdapterTypes';
import { ConnectionStatus } from '../../libs/enhancers/exportDLJSInterface';
import createHistoryMessageToDirectLineActivityMapper from '../mappers/createHistoryMessageToDirectLineActivityMapper';
import { convertThreadUpdate, processParticipants } from './ParticipantsConverter';
import { isChatMessageTypeSupported } from '../../utils/MessageUtils';
import { Constants } from '../../Constants';

export const processHistoryMessage = async (
  pagedHistoryMessagesBeforeWebChatInit: ChatMessage[],
  message: ChatMessage,
  logDescription: string,
  unsubscribed: boolean,
  getState: GetStateFunction<ACSAdapterState>,
  next: (activity: void | ACSDirectLineActivity) => void
): Promise<boolean> => {
  // Only process messages of supported message types
  if (!isChatMessageTypeSupported(message.type)) {
    return false;
  }
  // Handle disconnected state
  if (getState(StateKey.WebChatStatus) !== ConnectionStatus.Connected) {
    LoggerUtils.logCachedPagedHistoryMessage(logDescription, message, getState);
    pagedHistoryMessagesBeforeWebChatInit.push(message);
    return true;
  }
  if (!unsubscribed) {
    // Process by message type
    switch (message.type) {
      case 'text': {
        const activity = await convertHistoryTextMessage(message, getState);
        next(activity);
        break;
      }
      case 'participantAdded': {
        if (message.content.participants) {
          processParticipants(message.content.participants, Constants.PARTICIPANT_JOINED, getState, next);
        }
        break;
      }
      case 'participantRemoved': {
        if (message.content.participants) {
          processParticipants(message.content.participants, Constants.PARTICIPANT_LEFT, getState, next);
        }
        break;
      }
    }
  }

  return true;
};

export const convertAndProcessHistoryMessageByType = async (
  message: ChatMessage,
  getState: GetStateFunction<ACSAdapterState>,
  next: (activity: void | ACSDirectLineActivity) => void,
  logDescription: string
): Promise<void> => {
  switch (message.type) {
    case 'text': {
      const activity = await convertHistoryTextMessage(message, getState);
      updateHistoryActivityFromFieldIfActivityValid(activity, message, getState, next, logDescription);
      break;
    }
    case 'participantAdded': {
      for (const participant of message.content.participants) {
        const activity = await convertThreadUpdate(getState, participant, Constants.PARTICIPANT_JOINED);
        updateHistoryActivityFromFieldIfActivityValid(activity, message, getState, next, logDescription);
      }
      break;
    }
    case 'participantRemoved': {
      for (const participant of message.content.participants) {
        const activity = await convertThreadUpdate(getState, participant, Constants.PARTICIPANT_LEFT);
        updateHistoryActivityFromFieldIfActivityValid(activity, message, getState, next, logDescription);
      }
      break;
    }
  }
};

const updateHistoryActivityFromFieldIfActivityValid = (
  activity: void | ACSDirectLineActivity,
  message: ChatMessage,
  getState: GetStateFunction<ACSAdapterState>,
  next: (activity: void | ACSDirectLineActivity) => void,
  logDescription: string
): void => {
  if (activity) {
    LoggerUtils.logAdapterPostActivity(getState, logDescription + activity.messageid, message);

    // Properly set the fromList property with correct typing
    if (!activity.channelData) {
      activity.channelData = {};
    }
    activity.channelData.fromList = true;

    next(activity);
  }
};

const convertHistoryTextMessage = async (
  message: ChatMessage,
  getState: GetStateFunction<ACSAdapterState>
): Promise<void | ACSDirectLineActivity> => {
  const activity = await createHistoryMessageToDirectLineActivityMapper({ getState })()(message);
  LoggerUtils.logConvertHistoryMessage(message, 'ACS Adapter: convert history message');
  return activity;
};
