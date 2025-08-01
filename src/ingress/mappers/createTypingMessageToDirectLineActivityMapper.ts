import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { ActivityType, IDirectLineActivity } from '../../types/DirectLineTypes';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { ChatThreadClient, TypingIndicatorReceivedEvent } from '@azure/communication-chat';
import { Constants } from '../../Constants';
import { GetStateFunction } from '../../types/AdapterTypes';
import { Role } from '../../types/DirectLineTypes';
import { getIdFromIdentifier } from '../ingressHelpers';
import { LoggerUtils } from '../../utils/LoggerUtils';

export default function createTypingMessageToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<TypingIndicatorReceivedEvent, ACSDirectLineActivity> {
  return () => async (message: TypingIndicatorReceivedEvent) => {
    const chatClient: ChatThreadClient = getState(StateKey.ChatClient);

    if (!chatClient) {
      const errorMessage = 'ACS Adapter: Failed to ingress typing message without an active chatClient.';
      LoggerUtils.logTypingMessageIngressFailed(getState, message, errorMessage);
      throw new Error(errorMessage);
    }

    const { receivedOn: timestamp, sender } = message;

    const userId = getIdFromIdentifier(sender);

    const activity: IDirectLineActivity = {
      channelId: Constants.ACS_CHANNEL,
      conversation: { id: getState(StateKey.UserId) },
      from: {
        id: userId,
        name: message.senderDisplayName,
        role: userId === getState(StateKey.UserId) ? Role.User : Role.Bot
      },
      timestamp: new Date(timestamp).toISOString(),
      type: ActivityType.Typing
    };

    return activity;
  };
}
