import { AsyncMapper } from '../../types/AsyncMapper';
import { ACSDirectLineActivity } from '../../models/ACSDirectLineActivity';
import { ACSAdapterState } from '../../models/ACSAdapterState';
import { GetStateFunction } from '../../types/AdapterTypes';
import { IUserUpdate } from '../../types/DirectLineTypes';
export default function createThreadUpdateToDirectLineActivityMapper({ getState }: {
    getState: GetStateFunction<ACSAdapterState>;
}): AsyncMapper<IUserUpdate, ACSDirectLineActivity>;
//# sourceMappingURL=createThreadUpdateToDirectLineActivityMapper.d.ts.map