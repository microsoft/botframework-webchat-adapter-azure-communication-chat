const clientIdToMessageIdMap: { [key: string]: string } = {};

// clientActivityId is used by Webchat to determine if a message has been sent or not
export const setMessageIdToClientId = (messageId: string, clientId: string): void => {
  clientIdToMessageIdMap[messageId] = clientId;
};

export const getClientId = (messageId: string): string => {
  const clientId = clientIdToMessageIdMap[messageId];
  return clientId;
};
