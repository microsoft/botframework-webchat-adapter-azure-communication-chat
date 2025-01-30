import { ChatEqualityFields } from '../types';

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const checkDuplicateMessage = (
  messageCache: Map<string, ChatEqualityFields>,
  messageId: string,
  receivedChatMessage: ChatEqualityFields
): boolean => {
  const existingProcessedMessage: ChatEqualityFields = messageCache?.get(messageId);
  if (existingProcessedMessage) {
    const isContentSame = existingProcessedMessage.content === receivedChatMessage.content;
    const isUpdatedMessage = existingProcessedMessage.updatedOn !== receivedChatMessage.updatedOn;
    const existingFileIds = existingProcessedMessage.fileIds ? new Set(existingProcessedMessage.fileIds) : undefined;
    const receivedFileIds = receivedChatMessage.fileIds ? new Set(receivedChatMessage.fileIds) : undefined;
    const hasSameFileIds =
      (!existingFileIds && !receivedFileIds) ||
      (existingFileIds.size === receivedFileIds.size &&
        [...existingFileIds].every((fileId) => receivedFileIds.has(fileId)));
    return isContentSame && !isUpdatedMessage && hasSameFileIds;
  }

  return false;
};
