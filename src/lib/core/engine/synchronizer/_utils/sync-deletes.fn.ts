
import type { TUniqueIdentifier } from '../../_types/element.type';
import type { ITableDeletes } from '../../network/network.interfaces';
import type { TDataType } from '../synchronizer-state-detector.fn';

/**
 * Synchronizes deletes between local and remote.
 * 
 * @param localDeletes 
 * @param remoteDeletes 
 * @param deleteLocally 
 * @param deleteRemotely 
 */
export const replayDeletes = (
    localDeletes: ReadonlyArray<Readonly<ITableDeletes>>,
    remoteDeletes: ReadonlyArray<Readonly<ITableDeletes>>,

    deleteLocally: (tableName: string, cuids: TUniqueIdentifier[] | ReadonlyArray<TDataType<unknown>>) => Promise<void>,
    deleteRemotely: (tableName: string, cuids: TUniqueIdentifier[] | ReadonlyArray<TDataType<unknown>>) => Promise<void>,
): Promise<void> => {

    // 3. Delete local deletes remotely
    for (const { tableName, deletes } of localDeletes) {
        deleteRemotely(tableName, deletes.map(({ cuid }) => cuid));
    }

    // 4. Delete remote deletes locally
    for (const { tableName, deletes } of remoteDeletes) {
        deleteLocally(tableName, deletes.map(({ cuid }) => cuid));
    }

    return Promise.resolve();
}