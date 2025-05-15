export enum ActivityType {
  Message = 'message',
  Typing = 'typing'
}

export enum Role {
  Bot = 'bot',
  Channel = 'channel',
  Unknown = '',
  User = 'user'
}

export type CardAction = any;
export type SuggestedActions = { actions: CardAction[]; to?: string[] };

// We are excluding:
// - Date, because it will be stringified as a string via toISOString().
// - function, because it don't stringify and will be ignored.
// - undefined, because it don't stringify, will fail "'key' in obj" check.
export type TwoWaySerializablePrimitive = boolean | null | number | string;

// This is more restricted than JSON.
// We want to make sure stringify/parse will return a structure exactly the same.
// However, we cannot define a non-cyclic structure here.
export type TwoWaySerializableComplex = {
  [key: string]:
    | TwoWaySerializableComplex
    | TwoWaySerializableComplex[]
    | TwoWaySerializablePrimitive
    | TwoWaySerializablePrimitive[];
};

export interface IDirectLineActivity {
  attachments?: IAttachment[];
  channelData?: TwoWaySerializableComplex;
  channelId: string;
  // TODO: Update after verifying if this is threadId
  conversation: {
    id: string;
  };
  from: {
    id: string;
    name?: string;
    role?: Role;
  };
  // TODO: Clean up id, messageId, channelData.messageId after verifying usage
  id?: string;
  suggestedActions?: SuggestedActions;
  text?: string;
  timestamp: string;
  type: ActivityType;
  value?: any;
  attachmentLayout?: string;
  messageid?: string;
  previousClientActivityID?: string;
  entities?: TwoWaySerializableComplex[];
}

export interface IAttachment {
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

export interface IUserUpdate {
  displayName: string;
  tag: string;
  id: string;
}

export const DIRECT_LINE_ACTIVITY_ENTITIES_MESSAGE_STREAMING_VALUE = 'streaminfo';
