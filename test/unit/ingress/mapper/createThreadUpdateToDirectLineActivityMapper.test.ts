import createThreadUpdateToDirectLineActivityMapper from '../../../../src/ingress/mappers/createThreadUpdateToDirectLineActivityMapper';
import { StateKey } from '../../../../src/models/ACSAdapterState';
import { IUserUpdate, ActivityType, Role } from '../../../../src/types/DirectLineTypes';
import { Constants } from '../../../../src/Constants';
import { ChannelDataTypes } from '../../../../src/types/ChannelDataTypes';

describe('createThreadUpdateToDirectLineActivityMapper', () => {
  const mockUserId = 'test-user-id';
  const mockGetState = jest.fn().mockImplementation((key: StateKey) => {
    if (key === StateKey.UserId) {
      return mockUserId;
    }
    return undefined;
  });

  const mockUserUpdate: IUserUpdate = {
    id: 'member-id',
    displayName: 'Test User',
    tag: 'mock_tag'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.toISOString to return consistent timestamp for tests
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T00:00:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should map user update to a DirectLine activity with correct properties', async () => {
    const mapper = createThreadUpdateToDirectLineActivityMapper({ getState: mockGetState });
    const result = await mapper()(mockUserUpdate);

    expect(result).toEqual({
      channelId: Constants.ACS_CHANNEL,
      conversation: { id: undefined },
      channelData: {
        type: ChannelDataTypes.THREAD,
        members: [
          {
            id: mockUserUpdate.id,
            displayName: mockUserUpdate.displayName,
            tag: mockUserUpdate.tag
          }
        ]
      },
      from: {
        id: undefined,
        name: undefined,
        role: Role.Channel
      },
      id: mockUserId,
      timestamp: '2023-01-01T00:00:00.000Z',
      type: ActivityType.Message,
      messageid: undefined,
      text: JSON.stringify(`${mockUserUpdate.displayName} ${mockUserUpdate.tag} chat`)
    });
  });

  test('should get userId from state', async () => {
    const mapper = createThreadUpdateToDirectLineActivityMapper({ getState: mockGetState });
    await mapper()(mockUserUpdate);

    expect(mockGetState).toHaveBeenCalledWith(StateKey.UserId);
  });
});
