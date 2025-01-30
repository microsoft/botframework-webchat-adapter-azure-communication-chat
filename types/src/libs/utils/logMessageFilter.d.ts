import { ActivityType, IDirectLineActivity, Role, TwoWaySerializableComplex } from '../../types/DirectLineTypes';
export interface LogDLActivity {
    attachmentsCount?: number;
    channelData?: TwoWaySerializableComplex;
    channelId: string;
    conversation: {
        id: string;
    };
    from: {
        role?: Role;
    };
    textLength?: number;
    id?: string;
    suggestedActionCount?: number;
    timestamp: string;
    type: ActivityType;
    hasValue?: boolean;
    messageid?: string;
    previousClientActivityID?: string;
}
export declare function logMessagefilter(message: IDirectLineActivity): string;
//# sourceMappingURL=logMessageFilter.d.ts.map