import { ACSAdapterState, StateKey } from '../../models/ACSAdapterState';
import { ActivityType, IDirectLineActivity } from '../../types/DirectLineTypes';

import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { ChannelDataTypes } from '../../types/ChannelDataTypes';
import { Constants } from '../../Constants';
import { GetStateFunction } from '../../types/AdapterTypes';
import { Role } from '../../types/DirectLineTypes';
import { ChatThreadDeletedEvent } from '@azure/communication-chat';

export default function createThreadDeleteToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatThreadDeletedEvent, ACSDirectLineActivity> {
  const convertThreadDeleteToActivity = (event: ChatThreadDeletedEvent, id: StateKey.UserId): IDirectLineActivity => {
    const activity: IDirectLineActivity = {
      channelId: Constants.ACS_CHANNEL,
      conversation: { id: undefined },
      channelData: {
        type: ChannelDataTypes.THREAD,
        properties: { deleteTime: event.deletedOn.toISOString(), isDeleted: 'True' }
      },
      from: {
        id: undefined,
        name: undefined,
        role: Role.Channel
      },
      id,
      timestamp: event.deletedOn.toISOString(),
      type: ActivityType.Message,
      messageid: undefined
    };
    return activity;
  };

  return () => async (event: ChatThreadDeletedEvent) => {
    return convertThreadDeleteToActivity(event, getState(StateKey.UserId));
  };
}
