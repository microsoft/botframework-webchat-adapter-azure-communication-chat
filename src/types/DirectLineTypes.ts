enum ActivityType {
  Message = 'message',
  Typing = 'typing'
}

enum Role {
  Bot = 'bot',
  Channel = 'channel',
  Unknown = '',
  User = 'user'
}

type CardAction = any;
type SuggestedActions = { actions: CardAction[]; to?: string[] };

// We are excluding:
// - Date, because it will be stringified as a string via toISOString().
// - function, because it don't stringify and will be ignored.
// - undefined, because it don't stringify, will fail "'key' in obj" check.
type TwoWaySerializablePrimitive = boolean | null | number | string;

// This is more restricted than JSON.
// We want to make sure stringify/parse will return a structure exactly the same.
// However, we cannot define a non-cyclic structure here.
type TwoWaySerializableComplex = {
  [key: string]:
    | TwoWaySerializableComplex
    | TwoWaySerializableComplex[]
    | TwoWaySerializablePrimitive
    | TwoWaySerializablePrimitive[];
};

interface IDirectLineActivity {
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
export type {
  CardAction,
  IDirectLineActivity,
  SuggestedActions,
  TwoWaySerializableComplex,
  TwoWaySerializablePrimitive,
  IUserUpdate,
  IAttachment
};
