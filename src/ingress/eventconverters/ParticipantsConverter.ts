import { ChatParticipant } from '@azure/communication-chat';
import { GetStateFunction } from '../../types/AdapterTypes';
import { ACSAdapterState } from '../../models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { getIdFromIdentifier } from '../ingressHelpers';
import { IUserUpdate } from '../../types/DirectLineTypes';
import createThreadUpdateToDirectLineActivityMapper from '../mappers/createThreadUpdateToDirectLineActivityMapper';
import { logConvertThreadUpdateEvent } from '../../utils/LoggerUtils';

export const processParticipants = async (
  participants: ChatParticipant[],
  tag: string,
  getState: GetStateFunction<ACSAdapterState>,
  next: (activity: void | ACSDirectLineActivity) => void
): Promise<void> => {
  for (const participant of participants) {
    const activity = await convertThreadUpdate(getState, participant, tag);
    next(activity);
  }
};

export const convertThreadUpdate = async (
  getState: GetStateFunction<ACSAdapterState>,
  participant: ChatParticipant,
  tag: string
): Promise<void | ACSDirectLineActivity> => {
  const userId = getIdFromIdentifier(participant.id);
  const user: IUserUpdate = {
    displayName: participant.displayName,
    tag,
    id: userId
  };
  const activity = await createThreadUpdateToDirectLineActivityMapper({ getState })()(user);

  logConvertThreadUpdateEvent();

  return activity;
};
