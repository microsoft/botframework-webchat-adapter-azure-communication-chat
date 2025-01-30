import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { ActivityType, IDirectLineActivity } from '../../types/DirectLineTypes';
import { LogLevel, Logger } from '../../log/Logger';

import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { ChatThreadClient, TypingIndicatorReceivedEvent } from '@azure/communication-chat';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { Constants } from '../../Constants';
import { GetStateFunction } from '../../types/AdapterTypes';
import { LogEvent } from '../../types/LogTypes';
import { Role } from '../../types/DirectLineTypes';
import { getIdFromIdentifier } from '../ingressHelpers';

export default function createTypingMessageToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<TypingIndicatorReceivedEvent, ACSDirectLineActivity> {
  return () => async (message: TypingIndicatorReceivedEvent) => {
    const chatClient: ChatThreadClient = getState(StateKey.ChatClient);

    if (!chatClient) {
      const errorMessage = 'ACS Adapter: Failed to ingress typing message without an active chatClient.';
      Logger.logEvent(LogLevel.ERROR, {
        Event: LogEvent.ACS_ADAPTER_INGRESS_FAILED,
        Description: errorMessage,
        ACSRequesterUserId: getState(StateKey.UserId),
        MessageSender: (message.sender as CommunicationUserIdentifier).communicationUserId,
        TimeStamp: message.receivedOn.toISOString(),
        ChatThreadId: message.threadId
      });
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
