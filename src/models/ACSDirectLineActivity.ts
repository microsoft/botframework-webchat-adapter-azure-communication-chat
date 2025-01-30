import { IDirectLineActivity } from '../types/DirectLineTypes';
import { IUploadedFile } from '../types/FileManagerTypes';

// TODO: Define each Activity type
export type ACSDirectLineActivity = IDirectLineActivity & {
  // TODO: type clientActivityID and update after verifying its usage
  channelData?: {
    members?: any[];
    middlewareData?: {
      [name: string]: string;
    };
    properties?: any;
    tags?: string;
    type?: string;
    uploadedFiles?: IUploadedFile[];
    metadata?: Record<string, string>;
  };
};
