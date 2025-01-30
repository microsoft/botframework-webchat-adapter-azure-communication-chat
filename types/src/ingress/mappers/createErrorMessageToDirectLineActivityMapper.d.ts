import { AsyncMapper } from '../../types/AsyncMapper';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { ACSAdapterState } from '../../models/ACSAdapterState';
import { GetStateFunction } from '../../types/AdapterTypes';
export default function createErrorMessageToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<Error, ACSDirectLineActivity>;
//# sourceMappingURL=createErrorMessageToDirectLineActivityMapper.d.ts.map