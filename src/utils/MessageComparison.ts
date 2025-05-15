import {
  ChatMessage,
  ChatParticipant,
  ParticipantsAddedEvent,
  ParticipantsRemovedEvent
} from '@azure/communication-chat';
import { ChatEqualityFields } from '../types';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { isParticipantsAddedEvent, isParticipantsRemovedEvent } from './MessageUtils';

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

export const checkDuplicateParticipantMessage = (
  messageCache: Map<string, ChatEqualityFields>,
  messageId: string,
  receivedChatMessage: ChatEqualityFields
): boolean => {
  const existingProcessedMessage: ChatEqualityFields = messageCache?.get(messageId);
  if (existingProcessedMessage) {
    let hasSameAddedParticipants = false;
    if (receivedChatMessage.addedParticipants) {
      hasSameAddedParticipants = hasSameParticipants(
        receivedChatMessage.addedParticipants,
        existingProcessedMessage.addedParticipants
      );
    } else if (receivedChatMessage.removedParticipants) {
      hasSameAddedParticipants = hasSameParticipants(
        receivedChatMessage.removedParticipants,
        existingProcessedMessage.removedParticipants
      );
    }
    return hasSameAddedParticipants;
  }

  return false;
};

const hasSameParticipants = (
  receivedParticipants: ChatParticipant[],
  existingParticipants: ChatParticipant[]
): boolean => {
  // If lengths differ, they can't be the same set
  if (receivedParticipants.length !== existingParticipants.length) {
    return false;
  }

  // Create a map of existing participants by ID for efficient lookup
  const existingParticipantsMap = new Map<string, ChatParticipant>();

  for (const participant of existingParticipants) {
    const id =
      'communicationUserId' in participant.id
        ? (participant.id as CommunicationUserIdentifier).communicationUserId
        : JSON.stringify(participant.id);
    existingParticipantsMap.set(id, participant);
  }

  // Check if all received participants match existing ones
  for (const receivedParticipant of receivedParticipants) {
    const id =
      'communicationUserId' in receivedParticipant.id
        ? (receivedParticipant.id as CommunicationUserIdentifier).communicationUserId
        : JSON.stringify(receivedParticipant.id);

    const existingParticipant = existingParticipantsMap.get(id);

    // If no matching ID found or properties don't match
    if (
      !existingParticipant ||
      receivedParticipant.displayName !== existingParticipant.displayName ||
      !isSameShareHistoryTime(
        receivedParticipant.shareHistoryTime.toISOString().substring(0, 19),
        existingParticipant.shareHistoryTime.toISOString().substring(0, 19)
      )
    ) {
      return false;
    }
  }

  return true;
};

// Helper to compare Date objects or undefined values
const isSameShareHistoryTime = (time1?: string, time2?: string): boolean => {
  if (!time1 && !time2) return true;
  if (!time1 || !time2) return false;
  return time1 === time2;
};

/**
 * Generates a unique key for a group of chat participants based on the message details. ParticipantsAddedEvent/ParticipantsRemovedEvent doesn't include id or any unique identifier that can be reused so we need to create a key based on the message details.
 *
 * @param message - The chat message containing the sender ID, timestamp, and participants.
 */
export const createParticipantMessageKeyWithMessage = (message: ChatMessage): string => {
  if (!message.content?.initiator) {
    throw new Error('Message does not contain initiator information');
  }
  if (!message.content?.participants) {
    throw new Error('Message does not contain participants information');
  }
  return createParticipantMessageKey(
    (message.content?.initiator as CommunicationUserIdentifier).communicationUserId,
    message.createdOn.toISOString().substring(0, 19),
    message.content.participants
  );
};

/**
 * Generates a unique key for a group of chat participants based on the event details. ParticipantsAddedEvent/ParticipantsRemovedEvent doesn't include id or any unique identifier that can be reused so we need to create a key based on the message details.
 *
 * @param message - The chat message containing the sender ID, timestamp, and participants.
 */
export const createParticipantMessageKeyWithParticipantsEvent = (
  event: ParticipantsAddedEvent | ParticipantsRemovedEvent
): string => {
  if (isParticipantsAddedEvent(event)) {
    return createParticipantMessageKey(
      (event.addedBy.id as CommunicationUserIdentifier).communicationUserId,
      event.addedOn.toISOString().substring(0, 19),
      event.participantsAdded
    );
  } else if (isParticipantsRemovedEvent(event)) {
    return createParticipantMessageKey(
      (event.removedBy.id as CommunicationUserIdentifier).communicationUserId,
      event.removedOn.toISOString().substring(0, 19),
      event.participantsRemoved
    );
  }
  throw new Error('Event does not contain participants information');
};

/**
 * Generates a unique key for a group of chat participants based on the event/message details. Id can't be used as ParticipantsAddedEvent/ParticipantsRemovedEvent doesn't include id or any unique identifier that can be reused
 *
 * @param initiatorId - The ID of the user who initiated the participants list to be updated.
 * @param timestamp - The timestamp when the participants were updated.
 * @param participants - The list of participants.
 * @returns A string key composed of the timestamp, initiator ID, and sorted participant IDs.
 */
const createParticipantMessageKey = (
  initiatorId: string,
  timestamp: string,
  participants: ChatParticipant[]
): string => {
  const participantIds = participants
    .map((p) => (p.id as CommunicationUserIdentifier).communicationUserId)
    .sort()
    .join('_');

  // Hash the participant IDs to decrease string length and ensure uniqueness
  const participantsHash = hashString(participantIds);
  return `${timestamp}_${initiatorId}_${participantsHash}`;
};

// Simple string hash function
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
};
