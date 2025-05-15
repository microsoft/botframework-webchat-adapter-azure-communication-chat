import {
  ChatMessageReceivedEvent,
  ChatMessageType,
  ParticipantsAddedEvent,
  ParticipantsRemovedEvent
} from '@azure/communication-chat';

export const isChatMessageTypeSupported = (messageType: ChatMessageType): boolean => {
  return messageType === 'text' || messageType === 'participantAdded' || messageType === 'participantRemoved';
};

/**
 * Type guard that checks if the event is a ParticipantsAddedEvent
 * @param event The event to check
 * @returns Type predicate indicating if event is a ParticipantsAddedEvent
 */
export const isParticipantsAddedEvent = (
  event: ParticipantsAddedEvent | ParticipantsRemovedEvent | ChatMessageReceivedEvent
): event is ParticipantsAddedEvent => {
  return 'participantsAdded' in event;
};

/**
 * Type guard that checks if the event is a ParticipantsRemovedEvent
 * @param event The event to check
 * @returns Type predicate indicating if event is a ParticipantsRemovedEvent
 */
export const isParticipantsRemovedEvent = (
  event: ParticipantsAddedEvent | ParticipantsRemovedEvent | ChatMessageReceivedEvent
): event is ParticipantsRemovedEvent => {
  return 'participantsRemoved' in event;
};
