export type BotAttachment = {
  name: string;
  contentType: string;
  content: AmsReferenceContent;
};

type AmsReferenceContent = {
  uniqueId: string;
};
