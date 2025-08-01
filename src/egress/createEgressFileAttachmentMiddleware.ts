import { ACSAdapterState, StateKey } from '../models/ACSAdapterState';
import { LogLevel, Logger } from '../log/Logger';
import { ACSDirectLineActivity } from '../models/ACSDirectLineActivity';
import { ActivityType } from '../types/DirectLineTypes';
import { EgressMiddleware } from '../libs/applyEgressMiddleware';
import EventManager from '../utils/EventManager';
import { IFileManager } from '../types/FileManagerTypes';
import { LogEvent } from '../types/LogTypes';
import { ErrorEventSubscriber } from '../event/ErrorEventNotifier';
import { AdapterErrorEventType } from '../types/ErrorEventTypes';
import { LoggerUtils } from '../utils/LoggerUtils';

export default function createEgressFileAttachmentMiddleware(): EgressMiddleware<
  ACSDirectLineActivity,
  ACSAdapterState
> {
  return ({ getState }) =>
    (next) =>
    async (activity: ACSDirectLineActivity) => {
      if (activity.type !== ActivityType.Message || !(activity.attachments || []).length) {
        return next(activity);
      }

      const { attachments } = activity;
      const fileManager: IFileManager = getState(StateKey.FileManager);
      const eventManager: EventManager = getState(StateKey.EventManager);

      activity.channelData = {
        ...activity.channelData,
        uploadedFiles: []
      };

      LoggerUtils.logFileManagerUploadFileRequest(getState, activity.timestamp);

      try {
        const uploadedFiles = await fileManager.uploadFiles(attachments);

        // Add the uploaded file data to the activity
        activity.channelData.uploadedFiles = uploadedFiles;
      } catch (exception) {
        LoggerUtils.logFileManagerUploadFileFailed(getState, activity.timestamp, exception);
        ErrorEventSubscriber.notifyErrorEvent({
          ErrorType: AdapterErrorEventType.EGRESS_ATTACHMENT_UPLOAD_FAILED,
          ErrorMessage: exception.message,
          ErrorStack: exception.stack,
          ErrorDetails: (exception as any)?.details,
          Timestamp: activity.timestamp,
          AcsChatDetails: {
            ThreadId: getState(StateKey.ThreadId),
            RequesterUserId: getState(StateKey.UserId)
          },
          AdditionalParams: {
            activity
          },
          CorrelationVector: exception?.request?.headers?.get('ms-cv')
        });
        eventManager.handleError(exception);
      }

      // Pass to MessageActivity middleware
      next(activity);
    };
}
