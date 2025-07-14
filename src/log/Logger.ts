import { LogEvent } from '../types/LogTypes';

export enum LogLevel {
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

interface ACSLogData {
  Description?: string;
  ACSRequesterUserId?: string;
  MessageSender?: string;
  UserAdded?: string[];
  UserRemoved?: string[];
  ChatThreadId?: string;
  ChatMessageId?: string;
  ClientActivityId?: string;
  TimeStamp?: string;
  Event?: LogEvent;
  ErrorCode?: string;
  ExceptionDetails?: any;
  CustomProperties?: any;
}

export interface ILogger {
  logEvent(loglevel: LogLevel, event: ACSLogData): void;
}

interface AdapterLogger extends ILogger {
  setInstance(logger: ILogger): void;
  loggerInstance: ILogger;
}

export const Logger: AdapterLogger = {
  loggerInstance: undefined,
  setInstance: (logger: ILogger) => {
    Logger.loggerInstance = logger;
  },
  logEvent: (loglevel: LogLevel, event: ACSLogData) => {
    if (Logger.loggerInstance !== undefined) {
      Logger.loggerInstance.logEvent(loglevel, event);
    }
  }
};
