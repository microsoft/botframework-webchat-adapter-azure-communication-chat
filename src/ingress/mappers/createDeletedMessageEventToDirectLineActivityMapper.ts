import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { ActivityType, IDirectLineActivity } from '../../types/DirectLineTypes';
import { ChatClient, ChatMessageDeletedEvent } from '@azure/communication-chat';
import { getIdFromIdentifier } from '../ingressHelpers';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { Constants } from '../../Constants';
import { GetStateFunction } from '../../types/AdapterTypes';
import { Role } from '../../types/DirectLineTypes';
import uniqueId from '../../utils/uniqueId';

export default function createDeletedMessageEventToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatMessageDeletedEvent, ACSDirectLineActivity> {
  return () => async (event: ChatMessageDeletedEvent) => {
    const chatClient: ChatClient = getState(StateKey.ChatClient);

    if (!chatClient) {
      const errorMessage = 'ACS Adapter: Failed to ingress deleted message without an active chatClient.';
      throw new Error(errorMessage);
    }

    const senderId = getIdFromIdentifier(event.sender);

    const activity: IDirectLineActivity = {
      channelId: Constants.ACS_CHANNEL,
      channelData: {
        'webchat:sequence-id': parseInt(event.id),
        additionalMessageMetadata: {
          deletedOn: event.deletedOn.toISOString()
        }
      },
      conversation: { id: getState(StateKey.UserId) },
      from: {
        id: senderId,
        name: event.senderDisplayName,
        role: senderId === getState(StateKey.UserId) ? Role.User : Role.Bot
      },
      messageid: event.id,
      id: event.id ? event.id : uniqueId(),
      text: '',
      timestamp: event.createdOn.toISOString(),
      type: ActivityType.Message
    };
    return activity;
  };
}
