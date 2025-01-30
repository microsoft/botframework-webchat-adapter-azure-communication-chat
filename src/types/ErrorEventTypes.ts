export enum AdapterErrorEventType {
  EDITED_MESSAGE_ATTACHMENT_DOWNLOAD_FAILED = 'EDITED_MESSAGE_ATTACHMENT_DOWNLOAD_FAILED',
  HISTORY_MESSAGE_METADATA_FILEID_FETCH_FAILED = 'HISTORY_MESSAGE_METADATA_FILEID_FETCH_FAILED',
  NEW_MESSAGE_DOWNLOAD_ATTACHMENT_FAILED = 'NEW_MESSAGE_DOWNLOAD_ATTACHMENT_FAILED',
  MESSAGE_POLLING_FAILED = 'MESSAGE_POLLING_FAILED',
  INGRESS_MESSAGE_INVALID_JSON = 'INGRESS_MESSAGE_INVALID_JSON',
  EGRESS_ATTACHMENT_UPLOAD_FAILED = 'EGRESS_ATTACHMENT_UPLOAD_FAILED',
  EGRESS_SEND_MESSAGE_FAILED = 'EGRESS_SEND_MESSAGE_FAILED',
  ADAPTER_INIT_TOKEN_MISSING_ERROR = 'ADAPTER_INIT_TOKEN_MISSING_ERROR',
  ADAPTER_INIT_THREAD_ID_MISSING_ERROR = 'ADAPTER_INIT_THREAD_ID_MISSING_ERROR',
  ADAPTER_INIT_EXCEPTION = 'ADAPTER_INIT_EXCEPTION',
  ADAPTER_RECONNECT_FAILED = 'ADAPTER_RECONNECT_FAILED'
}
