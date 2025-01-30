import { ACSAdapterState } from '../../models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { TypingIndicatorReceivedEvent } from '@azure/communication-chat';
import { GetStateFunction } from '../../types/AdapterTypes';
export default function createTypingMessageToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<TypingIndicatorReceivedEvent, ACSDirectLineActivity>;
//# sourceMappingURL=createTypingMessageToDirectLineActivityMapper.d.ts.map