import { ChatMessageDeletedEvent, ChatMessageEditedEvent } from '@azure/communication-chat';
import {
  convertEditedMessageEvent,
  convertDeletedMessageEvent
} from '../../../../src/ingress/eventconverters/MessageConverter';
import createEditedMessageToDirectLineActivityMapper from '../../../../src/ingress/mappers/createEditedMessageToDirectLineActivityMapper';
import createDeletedMessageEventToDirectLineActivityMapper from '../../../../src/ingress/mappers/createDeletedMessageEventToDirectLineActivityMapper';
import { ACSDirectLineActivity } from '../../../../src/models/ACSDirectLineActivity';
import { GetStateFunction } from '../../../../src/types';
import { ACSAdapterState } from '../../../../src';
import { LoggerUtils } from '../../../../src/utils/LoggerUtils';

// Mock dependencies
jest.mock('../../../../src/ingress/mappers/createEditedMessageToDirectLineActivityMapper');
jest.mock('../../../../src/ingress/mappers/createDeletedMessageEventToDirectLineActivityMapper');

describe('MessageConverter', () => {
  // Mock data
  const mockGetState: GetStateFunction<ACSAdapterState> = jest.fn();
  const mockActivity: ACSDirectLineActivity = { type: 'message', id: 'test-id' } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(LoggerUtils, 'logConvertEditedMessageEvent').mockImplementation(jest.fn());
    jest.spyOn(LoggerUtils, 'logEditEventIngressFailed').mockImplementation(jest.fn());
    jest.spyOn(LoggerUtils, 'logConvertDeletedMessageEvent').mockImplementation(jest.fn());
    jest.spyOn(LoggerUtils, 'logDeletedMessageEventIngressFailed').mockImplementation(jest.fn());
  });

  describe('convertEditedMessageEvent', () => {
    const mockEditedEvent: ChatMessageEditedEvent = {
      sender: { communicationUserId: 'user-id', kind: 'communicationUser' },
      editedOn: new Date(),
      version: '1',
      type: 'chatMessageEdited',
      message: 'Edited message content',
      metadata: {},
      id: 'message-id',
      createdOn: new Date(),
      threadId: 'thread-123',
      senderDisplayName: 'Sender Name',
      recipient: { communicationUserId: 'recipient-id', kind: 'communicationUser' }
    };

    it('should convert edited message event to DirectLine activity', async () => {
      const innerFn = jest.fn().mockReturnValue(mockActivity);
      const middleFn = jest.fn().mockReturnValue(innerFn);
      (createEditedMessageToDirectLineActivityMapper as jest.Mock).mockReturnValue(middleFn);

      const result = await convertEditedMessageEvent(mockEditedEvent, mockGetState);

      expect(createEditedMessageToDirectLineActivityMapper).toHaveBeenCalledWith({ getState: mockGetState });
      expect(middleFn).toHaveBeenCalled();
      expect(innerFn).toHaveBeenCalledWith(mockEditedEvent);
      expect(LoggerUtils.logConvertEditedMessageEvent).toHaveBeenCalledWith(mockEditedEvent);
      expect(result).toBe(mockActivity);
    });

    it('should handle errors when converting edited message event', async () => {
      const errorMessage = 'Test error';
      const error = new Error(errorMessage);
      const innerFn = jest.fn().mockImplementation(() => {
        throw error;
      });
      const middleFn = jest.fn().mockReturnValue(innerFn);
      (createEditedMessageToDirectLineActivityMapper as jest.Mock).mockReturnValue(middleFn);

      const result = await convertEditedMessageEvent(mockEditedEvent, mockGetState);

      expect(LoggerUtils.logEditEventIngressFailed).toHaveBeenCalledWith(mockEditedEvent, errorMessage, mockGetState);
      expect(result).toBeUndefined();
    });
  });

  describe('convertDeletedMessageEvent', () => {
    const mockDeletedEvent: ChatMessageDeletedEvent = {
      sender: { communicationUserId: 'user-id', kind: 'communicationUser' },
      deletedOn: new Date(),
      id: 'message-id',
      version: '1',
      type: 'chatMessageDeleted',
      createdOn: new Date(),
      threadId: 'thread-123',
      senderDisplayName: 'Sender Name',
      recipient: { communicationUserId: 'recipient-id', kind: 'communicationUser' }
    };

    it('should convert deleted message event to DirectLine activity', async () => {
      const innerFn = jest.fn().mockReturnValue(mockActivity);
      const middleFn = jest.fn().mockReturnValue(innerFn);
      (createDeletedMessageEventToDirectLineActivityMapper as jest.Mock).mockReturnValue(middleFn);

      const result = await convertDeletedMessageEvent(mockDeletedEvent, mockGetState);

      expect(createDeletedMessageEventToDirectLineActivityMapper).toHaveBeenCalledWith({ getState: mockGetState });
      expect(middleFn).toHaveBeenCalled();
      expect(innerFn).toHaveBeenCalledWith(mockDeletedEvent);
      expect(LoggerUtils.logConvertDeletedMessageEvent).toHaveBeenCalledWith(mockDeletedEvent);
      expect(result).toBe(mockActivity);
    });

    it('should handle errors when converting deleted message event', async () => {
      const errorMessage = 'Test error';
      const error = new Error(errorMessage);
      const innerFn = jest.fn().mockImplementation(() => {
        throw error;
      });
      const middleFn = jest.fn().mockReturnValue(innerFn);
      (createDeletedMessageEventToDirectLineActivityMapper as jest.Mock).mockReturnValue(middleFn);

      const result = await convertDeletedMessageEvent(mockDeletedEvent, mockGetState);

      expect(LoggerUtils.logDeletedMessageEventIngressFailed).toHaveBeenCalledWith(
        mockDeletedEvent,
        errorMessage,
        mockGetState
      );
      expect(result).toBeUndefined();
    });
  });
});
