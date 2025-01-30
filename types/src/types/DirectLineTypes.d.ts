declare enum ActivityType {
    Message = "message",
    Typing = "typing"
}
declare enum Role {
    Bot = "bot",
    Channel = "channel",
    Unknown = "",
    User = "user"
}
type CardAction = any;
type SuggestedActions = {
    actions: CardAction[];
    to?: string[];
};
type TwoWaySerializablePrimitive = boolean | null | number | string;
type TwoWaySerializableComplex = {
    [key: string]: TwoWaySerializableComplex | TwoWaySerializableComplex[] | TwoWaySerializablePrimitive | TwoWaySerializablePrimitive[];
};
interface IDirectLineActivity {
    attachments?: IAttachment[];
    channelData?: TwoWaySerializableComplex;
    channelId: string;
    conversation: {
        id: string;
    };
    from: {
        id: string;
        name?: string;
        role?: Role;
    };
    id?: string;
    suggestedActions?: SuggestedActions;
    text?: string;
    timestamp: string;
    type: ActivityType;
    value?: any;
    attachmentLayout?: string;
    messageid?: string;
    previousClientActivityID?: string;
}
interface IAttachment {
    /**
     * The filename.
     */
    name: string;
    /**
     * MIME-type.
     */
    contentType: string;
    /**
     * The URL to download the file contents.
     */
    contentUrl: string;
    /**
     * Thumnbnail URL for images and videos.
     */
    thumbnailUrl?: string;
}
interface IUserUpdate {
    displayName: string;
    tag: string;
    id: string;
}
export { ActivityType, Role };
export type { CardAction, IDirectLineActivity, SuggestedActions, TwoWaySerializableComplex, TwoWaySerializablePrimitive, IUserUpdate, IAttachment };
//# sourceMappingURL=DirectLineTypes.d.ts.map