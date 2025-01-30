import { ACSAdapterState } from '../../models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { GetStateFunction } from '../../types/AdapterTypes';
import { ChatThreadDeletedEvent } from '@azure/communication-chat';
export default function createThreadDeleteToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatThreadDeletedEvent, ACSDirectLineActivity>;
//# sourceMappingURL=createThreadDeleteToDirectLineActivityMapper.d.ts.map