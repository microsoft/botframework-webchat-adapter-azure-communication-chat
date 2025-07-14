import { ChatEqualityFields } from '../../../src/types';
import {
  checkDuplicateMessage,
  checkDuplicateParticipantMessage,
  createParticipantMessageKeyWithMessage,
  createParticipantMessageKeyWithParticipantsEvent
} from '../../../src/utils/MessageComparison';
import {
  ChatMessage,
  ChatParticipant,
  ParticipantsAddedEvent,
  ParticipantsRemovedEvent
} from '@azure/communication-chat';
import { CommunicationUserIdentifier } from '@azure/communication-common';

describe('MessageComparison tests', () => {
  const testMessageCache: Map<string, ChatEqualityFields> = new Map([
    [
      '1',
      {
        content: 'test message 1',
        createdOn: new Date('2022-10-10T15:55:09Z')
      }
    ],
    [
      '2',
      {
        content: 'edited test message 2',
        createdOn: new Date('2022-10-10T15:58:06Z'),
        updatedOn: new Date('2022-10-10T15:59:05Z')
      }
    ],
    [
      '3',
      {
        content: '',
        createdOn: new Date('2022-10-10T15:58:25Z'),
        fileIds: ['file1', 'file2']
      }
    ],
    [
      '4',
      {
        content: '',
        createdOn: new Date('2022-10-10T15:55:09Z'),
        deletedOn: new Date('2022-10-10T15:59:05Z')
      }
    ]
  ]);

  test('checkDuplicateMessages message received again', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '1', {
      content: 'test message 1'
    });
    expect(isDuplicateMessage).toEqual(true);
  });

  test('checkDuplicateMessages new message', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '123', {
      content: 'test message 1'
    });
    expect(isDuplicateMessage).toEqual(false);
  });

  test('checkDuplicateMessages message updated', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '1', {
      content: 'updated test message 1',
      updatedOn: new Date('2022-10-10T15:58:09Z')
    });
    expect(isDuplicateMessage).toEqual(false);
  });

  test('checkDuplicateMessages message with same deletedOn value', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '4', {
      content: '',
      deletedOn: new Date('2022-10-10T15:59:05Z')
    });
    expect(isDuplicateMessage).toEqual(true);
  });

  test('checkDuplicateMessages message with deletedOn value', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '1', {
      content: '',
      deletedOn: new Date('2022-10-10T15:59:05Z')
    });
    expect(isDuplicateMessage).toEqual(false);
  });

  test('checkDuplicateMessages message with different deletedOn value', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '4', {
      content: '',
      deletedOn: new Date('2022-10-10T16:59:05Z')
    });
    expect(isDuplicateMessage).toEqual(false);
  });

  test('checkDuplicateMessages message with same deletedOn value', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '4', {
      content: '',
      deletedOn: new Date('2022-10-10T15:59:05Z')
    });
    expect(isDuplicateMessage).toEqual(true);
  });

  test('checkDuplicateMessages message received again with same fileIds', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '3', {
      content: '',
      fileIds: ['file2', 'file1']
    });
    expect(isDuplicateMessage).toEqual(true);
  });

  test('checkDuplicateMessages message updated with different fileIds', async () => {
    const isDuplicateMessage = checkDuplicateMessage(testMessageCache, '3', {
      content: '',
      updatedOn: new Date('2022-10-10T15:59:19Z'),
      fileIds: ['file1', 'file3']
    });
    expect(isDuplicateMessage).toEqual(false);
  });
});

describe('MessageComparison participants added tests', () => {
  const createdOn = new Date('2022-10-10T15:55:09Z');
  const testParticipants: ChatParticipant[] = [
    {
      id: { communicationUserId: 'user1', kind: 'communicationUser' } as CommunicationUserIdentifier,
      displayName: 'User 1',
      shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
      metadata: {}
    },
    {
      id: { communicationUserId: 'user2', kind: 'communicationUser' } as CommunicationUserIdentifier,
      displayName: 'User 2',
      shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
      metadata: {}
    }
  ];

  const testParticipantMessageCache: Map<string, ChatEqualityFields> = new Map([
    [
      'participant1',
      {
        addedParticipants: testParticipants,
        createdOn: createdOn
      }
    ]
  ]);

  test('checkDuplicateParticipantMessage with same participants', async () => {
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant1',
      {
        addedParticipants: testParticipants
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(true);
  });

  test('checkDuplicateParticipantMessage when different message id is passed', async () => {
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant123',
      {
        addedParticipants: testParticipants
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(false);
  });

  test('checkDuplicateParticipantMessage with different participants', async () => {
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant1',
      {
        addedParticipants: [
          {
            id: { communicationUserId: 'user3', kind: 'communicationUser' } as CommunicationUserIdentifier,
            displayName: 'User 3',
            shareHistoryTime: new Date('2022-10-10T15:55:09Z')
          }
        ]
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(false);
  });

  test('checkDuplicateParticipantMessage with same participants but different display name', async () => {
    const updatedParticipants = testParticipants.map((participant) => {
      return { ...participant, displayName: participant.displayName + 'Updated Display Name' };
    });
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant1',
      {
        addedParticipants: updatedParticipants
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(false);
  });

  test('createParticipantMessageKeyWithMessage should throw error when initiator is missing', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantAdded',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: undefined,
        participants: testParticipants
      },
      createdOn: createdOn
    };

    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).toThrow('Message does not contain initiator information');
  });

  test('createParticipantMessageKeyWithMessage should throw error when participants are missing', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantAdded',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: { communicationUserId: 'initiator1', kind: 'communicationUser' },
        participants: undefined
      },
      createdOn: createdOn
    };

    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).toThrow('Message does not contain participants information');
  });

  test('createParticipantMessageKeyWithMessage should throw error when content is undefined', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantAdded',
      sequenceId: '1',
      version: '1',
      content: undefined,
      createdOn: createdOn
    };
    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).toThrow('Message does not contain initiator information');
  });

  test('createParticipantMessageKeyWithMessage should not throw error when message contains required properties', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantAdded',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: { communicationUserId: 'initiator1', kind: 'communicationUser' },
        participants: testParticipants
      },
      createdOn: createdOn
    };
    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).not.toThrow();
  });

  test('createParticipantMessageKeyWithMessage generates correct key', async () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantAdded',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: { communicationUserId: 'initiator1', kind: 'communicationUser' },
        participants: testParticipants
      },
      createdOn: createdOn
    };

    const key = createParticipantMessageKeyWithMessage(message);
    expect(key).toEqual('2022-10-10T15:55:09_initiator1_539d920e');
  });

  test('createParticipantMessageKeyWithParticipantsEvent generates correct key for ParticipantsAddedEvent', async () => {
    const event: ParticipantsAddedEvent = {
      addedBy: {
        id: { communicationUserId: 'initiator2', kind: 'communicationUser' },
        displayName: 'initiator2Name',
        metadata: {}
      },
      addedOn: createdOn,
      // Participants array data is the same as testParticipants but events participant model is imported from signalling package (id type is different)
      participantsAdded: [
        {
          id: { communicationUserId: 'user1', kind: 'communicationUser' },
          displayName: 'User 1',
          shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
          metadata: {}
        },
        {
          id: { communicationUserId: 'user2', kind: 'communicationUser' },
          displayName: 'User 2',
          shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
          metadata: {}
        }
      ],
      threadId: 'testThreadId',
      version: '1'
    };

    const key = createParticipantMessageKeyWithParticipantsEvent(event);
    expect(key).toEqual('2022-10-10T15:55:09_initiator2_539d920e');
  });
});

describe('MessageComparison participants removed tests', () => {
  const createdOn = new Date('2022-10-10T15:55:09Z');
  const testParticipants: ChatParticipant[] = [
    {
      id: { communicationUserId: 'user1', kind: 'communicationUser' } as CommunicationUserIdentifier,
      displayName: 'User 1',
      shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
      metadata: {}
    },
    {
      id: { communicationUserId: 'user2', kind: 'communicationUser' } as CommunicationUserIdentifier,
      displayName: 'User 2',
      shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
      metadata: {}
    }
  ];

  const testParticipantMessageCache: Map<string, ChatEqualityFields> = new Map([
    [
      'participant1',
      {
        removedParticipants: testParticipants,
        createdOn: createdOn
      }
    ]
  ]);

  test('checkDuplicateParticipantMessage with same participants', async () => {
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant1',
      {
        removedParticipants: testParticipants
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(true);
  });

  test('checkDuplicateParticipantMessage when different message id is passed', async () => {
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant123',
      {
        removedParticipants: testParticipants
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(false);
  });

  test('checkDuplicateParticipantMessage with different participants', async () => {
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant1',
      {
        removedParticipants: [
          {
            id: { communicationUserId: 'user3', kind: 'communicationUser' } as CommunicationUserIdentifier,
            displayName: 'User 3',
            shareHistoryTime: new Date('2022-10-10T15:55:09Z')
          }
        ]
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(false);
  });

  test('checkDuplicateParticipantMessage with same participants but different display name', async () => {
    const updatedParticipants = testParticipants.map((participant) => {
      return { ...participant, displayName: participant.displayName + 'Updated Display Name' };
    });
    const isDuplicateParticipantMessage = checkDuplicateParticipantMessage(
      testParticipantMessageCache,
      'participant1',
      {
        removedParticipants: updatedParticipants
      }
    );
    expect(isDuplicateParticipantMessage).toEqual(false);
  });

  test('createParticipantMessageKeyWithMessage should throw error when initiator is missing', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantRemoved',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: undefined,
        participants: testParticipants
      },
      createdOn: createdOn
    };

    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).toThrow('Message does not contain initiator information');
  });

  test('createParticipantMessageKeyWithMessage should throw error when participants are missing', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantRemoved',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: { communicationUserId: 'initiator1', kind: 'communicationUser' },
        participants: undefined
      },
      createdOn: createdOn
    };

    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).toThrow('Message does not contain participants information');
  });

  test('createParticipantMessageKeyWithMessage should throw error when content is undefined', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantRemoved',
      sequenceId: '1',
      version: '1',
      content: undefined,
      createdOn: createdOn
    };
    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).toThrow('Message does not contain initiator information');
  });

  test('createParticipantMessageKeyWithMessage should not throw error when message contains required properties', () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantRemoved',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: { communicationUserId: 'initiator1', kind: 'communicationUser' },
        participants: testParticipants
      },
      createdOn: createdOn
    };
    expect(() => {
      createParticipantMessageKeyWithMessage(message);
    }).not.toThrow();
  });

  test('createParticipantMessageKeyWithMessage generates correct key', async () => {
    const message: ChatMessage = {
      id: '123',
      type: 'participantRemoved',
      sequenceId: '1',
      version: '1',
      content: {
        initiator: { communicationUserId: 'initiator1', kind: 'communicationUser' },
        participants: testParticipants
      },
      createdOn: createdOn
    };

    const key = createParticipantMessageKeyWithMessage(message);
    expect(key).toEqual('2022-10-10T15:55:09_initiator1_539d920e');
  });

  test('createParticipantMessageKeyWithParticipantsEvent generates correct key', async () => {
    const event: ParticipantsRemovedEvent = {
      removedBy: {
        id: { communicationUserId: 'initiator2', kind: 'communicationUser' },
        displayName: 'initiator2Name',
        metadata: {}
      },
      removedOn: createdOn,
      // Participants array data is the same as testParticipants but events participant model is imported from signalling package (id type is different)
      participantsRemoved: [
        {
          id: { communicationUserId: 'user1', kind: 'communicationUser' },
          displayName: 'User 1',
          shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
          metadata: {}
        },
        {
          id: { communicationUserId: 'user2', kind: 'communicationUser' },
          displayName: 'User 2',
          shareHistoryTime: new Date('2022-10-10T15:55:09Z'),
          metadata: {}
        }
      ],
      threadId: 'testThreadId',
      version: '1'
    };

    const key = createParticipantMessageKeyWithParticipantsEvent(event);
    expect(key).toEqual('2022-10-10T15:55:09_initiator2_539d920e');
  });
});
