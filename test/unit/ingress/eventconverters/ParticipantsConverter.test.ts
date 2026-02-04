import { ChatParticipant } from '@azure/communication-chat';
import { GetStateFunction } from '../../../../src/types/AdapterTypes';
import { ACSAdapterState } from '../../../../src/models/ACSAdapterState';
import { ACSDirectLineActivity } from '../../../../src/models/ACSDirectLineActivity';
import { getIdFromIdentifier } from '../../../../src/ingress/ingressHelpers';
import createThreadUpdateToDirectLineActivityMapper from '../../../../src/ingress/mappers/createThreadUpdateToDirectLineActivityMapper';
import {
  processParticipants,
  convertThreadUpdate
} from '../../../../src/ingress/eventconverters/ParticipantsConverter';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { ActivityType } from '../../../../src';
import { Constants } from '../../../../src/Constants';

// Mock dependencies
jest.mock('../../../../src/ingress/ingressHelpers');
jest.mock('../../../../src/ingress/mappers/createThreadUpdateToDirectLineActivityMapper');

describe('ParticipantsConverter', () => {
  let mockGetState: GetStateFunction<ACSAdapterState>;
  let mockNext: jest.Mock;
  let mockParticipant: ChatParticipant;
  let mockActivity: ACSDirectLineActivity;
  let mockMapperFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetState = jest.fn() as unknown as GetStateFunction<ACSAdapterState>;
    mockNext = jest.fn();

    mockParticipant = {
      id: { communicationUserId: 'user1' } as CommunicationUserIdentifier,
      displayName: 'Mock User',
      shareHistoryTime: new Date()
    };

    mockActivity = {
      text: 'Mock activity',
      channelId: 'test',
      conversation: { id: 'test-conversation' },
      from: { id: 'user1' },
      timestamp: new Date().toISOString(),
      type: ActivityType.Message
    };

    mockMapperFunction = jest.fn().mockResolvedValue(mockActivity);
    const mockMapper = jest.fn().mockReturnValue(mockMapperFunction);
    (createThreadUpdateToDirectLineActivityMapper as jest.Mock).mockReturnValue(mockMapper);
    (getIdFromIdentifier as jest.Mock).mockReturnValue('user1');
  });

  test('convertThreadUpdate should extract user ID and create thread update activity', async () => {
    const result = await convertThreadUpdate(mockGetState, mockParticipant, Constants.PARTICIPANT_JOINED);

    expect(getIdFromIdentifier).toHaveBeenCalledWith({ communicationUserId: 'user1' });
    expect(createThreadUpdateToDirectLineActivityMapper).toHaveBeenCalledWith({ getState: mockGetState });
    expect(mockMapperFunction).toHaveBeenCalledWith({
      displayName: 'Mock User',
      tag: Constants.PARTICIPANT_JOINED,
      id: 'user1'
    });
    expect(result).toBe(mockActivity);
  });

  test('processParticipants should process each participant and pass activity to next callback', async () => {
    const participants = [
      mockParticipant,
      {
        id: { communicationUserId: 'user2' } as CommunicationUserIdentifier,
        displayName: 'User Two',
        shareHistoryTime: new Date()
      }
    ];

    await processParticipants(participants, new Date(), 'mockTag', mockGetState, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockNext).toHaveBeenCalledWith(mockActivity);
    expect(createThreadUpdateToDirectLineActivityMapper).toHaveBeenCalledTimes(2);
  });

  test('processParticipants should handle empty participants array', async () => {
    await processParticipants([], new Date(), 'mockTag', mockGetState, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(createThreadUpdateToDirectLineActivityMapper).not.toHaveBeenCalled();
  });
});
