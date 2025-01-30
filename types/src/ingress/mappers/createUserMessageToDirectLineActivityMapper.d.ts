import { ACSAdapterState } from '../../models/ACSAdapterState';
import { ChatMessageReceivedEvent } from '@azure/communication-chat';
import { CommunicationIdentifier } from '@azure/communication-common';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { AsyncMapper } from '../../types/AsyncMapper';
import EventManager from '../../utils/EventManager';
import { GetStateFunction } from '../../types/AdapterTypes';
export declare function convertMessageToActivity(eventManager: EventManager, messageId: string, content: string, createdOn: Date, sender: CommunicationIdentifier, senderDisplayName: string, currentUserId: string, threadId: string, enableAdaptiveCards?: boolean, enableMessageErrorHandler?: boolean, metadata?: Record<string, string>, files?: File[], tags?: string, sequenceId?: string): Promise<ACSDirectLineActivity>;
export default function createUserMessageToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<ChatMessageReceivedEvent, ACSDirectLineActivity>;
//# sourceMappingURL=createUserMessageToDirectLineActivityMapper.d.ts.map