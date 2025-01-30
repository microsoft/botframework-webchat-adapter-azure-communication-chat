import { AsyncMapper } from '../../types/AsyncMapper';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { IDirectLineActivity, ActivityType } from '../../types/DirectLineTypes';
import { StateKey, ACSAdapterState } from '../../models/ACSAdapterState';
import { GetStateFunction } from '../../types/AdapterTypes';
import { IUserUpdate } from '../../types/DirectLineTypes';
import { Constants } from '../../Constants';
import { Role } from '../../types/DirectLineTypes';
import { ChannelDataTypes } from '../../types/ChannelDataTypes';

export default function createThreadUpdateToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<IUserUpdate, ACSDirectLineActivity> {
  const convertThreadUpdateToActivity = (
    member: IUserUpdate,
    id: StateKey.UserId,
    timestamp: string
  ): IDirectLineActivity => {
    const activity: IDirectLineActivity = {
      channelId: Constants.ACS_CHANNEL,
      conversation: { id: undefined },
      channelData: {
        type: ChannelDataTypes.THREAD,
        members: [{ id: member.id, displayName: member.displayName, tag: member.tag }]
      },
      from: {
        id: undefined,
        name: undefined,
        role: Role.Channel
      },
      id,
      timestamp,
      type: ActivityType.Message,
      messageid: undefined,
      text: JSON.stringify(`${member.displayName} ${member.tag} chat`)
    };
    return activity;
  };

  return () => async (member: IUserUpdate) => {
    return convertThreadUpdateToActivity(member, getState(StateKey.UserId), new Date().toISOString());
  };
}
