import { IDirectLineActivity } from '../types/DirectLineTypes';
import { IUploadedFile } from '../types/FileManagerTypes';
export type ACSDirectLineActivity = IDirectLineActivity & {
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
//# sourceMappingURL=ACSDirectLineActivity.d.ts.map