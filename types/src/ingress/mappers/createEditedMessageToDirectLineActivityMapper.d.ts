import { ACSAdapterState } from '../../models/ACSAdapterState';
import { ChatMessageEditedEvent } from '@azure/communication-chat';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { GetStateFunction } from '../../types/AdapterTypes';
export default function createEditedMessageToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatMessageEditedEvent, ACSDirectLineActivity>;
//# sourceMappingURL=createEditedMessageToDirectLineActivityMapper.d.ts.map