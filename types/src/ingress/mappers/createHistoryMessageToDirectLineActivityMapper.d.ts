import { ACSAdapterState } from '../../models/ACSAdapterState';
import { ChatMessage } from '@azure/communication-chat';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import { GetStateFunction } from '../../types/AdapterTypes';
export declare function createHistoryAttachmentMessageToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<{
    message: ChatMessage;
    files: File[];
}, ACSDirectLineActivity>;
export default function createHistoryMessageToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatMessage, ACSDirectLineActivity>;
//# sourceMappingURL=createHistoryMessageToDirectLineActivityMapper.d.ts.map