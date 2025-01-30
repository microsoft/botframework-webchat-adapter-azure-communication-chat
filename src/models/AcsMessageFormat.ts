import { BotAttachment } from './BotAttachment';

export type AcsMessageFormat = {
  text?: string;
  attachments?: BotAttachment[];
  suggestedActions?: any;
  value?: any;
  attachmentLayout?: string;
};
