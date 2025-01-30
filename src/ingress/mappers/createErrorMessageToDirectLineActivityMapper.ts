import { AsyncMapper } from '../../types/AsyncMapper';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { IDirectLineActivity, ActivityType } from '../../types/DirectLineTypes';
import { StateKey, ACSAdapterState } from '../../models/ACSAdapterState';
import { GetStateFunction } from '../../types/AdapterTypes';
import { Constants } from '../../Constants';
import { Role } from '../../types/DirectLineTypes';
import { ChannelDataTypes } from '../../types/ChannelDataTypes';

export default function createErrorMessageToDirectLineActivityMapper({
  getState
}: {
  getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<Error, ACSDirectLineActivity> {
  const convertErrorToActivity = (error: Error, id: StateKey.UserId, timestamp: string): IDirectLineActivity => {
    // Stringify the error and pass it in the activity text
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      details: (error as any)?.details
    };

    const activity: ACSDirectLineActivity = {
      channelId: Constants.ACS_CHANNEL,
      conversation: { id: undefined },
      channelData: {
        type: ChannelDataTypes.ERROR
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
      text: JSON.stringify(errorDetails)
    };
    return activity;
  };

  return () => async (error: Error) => {
    return convertErrorToActivity(error, getState(StateKey.UserId), new Date().toISOString());
  };
}
