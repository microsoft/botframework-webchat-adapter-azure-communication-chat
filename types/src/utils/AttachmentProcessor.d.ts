import { ACSAdapterState } from '..';
import { FileMetadata, GetStateFunction } from '../types';
import { CustomEvent } from './EventManager';
export declare const queueAttachmentDownloading: (event: CustomEvent, pendingFileDownloads: {
    [key: string]: Map<string, FileMetadata>;
}, getState: GetStateFunction<ACSAdapterState>) => Promise<void>;
//# sourceMappingURL=AttachmentProcessor.d.ts.map