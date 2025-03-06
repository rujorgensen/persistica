import type { TSynchronizerState } from '../synchronizer/synchronizer';
import type { ITableDeletes, TClientId } from '../network/network.interfaces';
import { setContainsSet } from '../../../utils/set.utils';

/**
 * Reacts to changes in the synchonization state.
 * 
 * @param { TClientId } remoteClientId 
 * @param deletedInTables 
 * @param onUpdateState 
 * @param readKnownPeers 
 * @param updateLocalDeleteLog 
 */
export const reactToSynchronizationStateChange = (
    remoteClientId: TClientId,

    deletedInTables: ReadonlyArray<Readonly<ITableDeletes>>,

    onUpdateState: (
        fn: (
            synchronizerState: TSynchronizerState,
        ) => Promise<void>,
    ) => void,

    readKnownPeers: (

    ) => Promise<ReadonlyArray<TClientId>>,

    updateLocalDeleteLog: (
        deletes: ReadonlyArray<Readonly<ITableDeletes>>,
    ) => Promise<void>,
): void => {
    let previousState: TSynchronizerState | undefined;

    onUpdateState(async (
        synchronizerState: TSynchronizerState,
    ) => {
        switch (previousState) {
            case 'synchronizing-deletes': {
                const newList: ReadonlyArray<Readonly<ITableDeletes>> = await calculateLocalDeleteLog(
                    remoteClientId,
                    deletedInTables,
                    readKnownPeers,
                );

                console.log('[reactToSynchronizationStateChange] Done synchroniziong deletes. Updating deleted tracking list');

                await updateLocalDeleteLog(newList);

                break;
            }
        }

        previousState = synchronizerState;
    });
}

/**
 * Synchronizes the local list of deleted items.
 * 
 * @param remoteClientId 
 * @param deletedInTables 
 * @param readKnownPeers 
 * @param updateDeletes 
 */
const calculateLocalDeleteLog = async (
    remoteClientId: TClientId,

    deletedInTables: ReadonlyArray<Readonly<ITableDeletes>>,

    readKnownPeers: (

    ) => Promise<ReadonlyArray<TClientId>>,
): Promise<ReadonlyArray<Readonly<ITableDeletes>>> => {
    const knownPeers: Set<TClientId> = new Set(await readKnownPeers());

    if (knownPeers.size === 0) {
        return [];
    }

    const deletedInTables_: Set<ITableDeletes> = new Set(deletedInTables);

    for (const deletedInTable of deletedInTables_) {
        // If no deletes were made on the table. Remove it.
        // if (deletedInTable.deletes.length === 0) {
        //     deletedInTables_.delete(deletedInTable);
        // }

        for (const deletedItem of deletedInTable.deletes) {
            deletedItem.synchronizedWith = [...new Set([...deletedItem.synchronizedWith, remoteClientId])];

            // If this leads to the fact that the change has been synchronized with all known peers, remove it.
            if (setContainsSet(new Set(deletedItem.synchronizedWith), knownPeers)) {
                deletedInTables_.delete(deletedInTable);
            }
        }
    }

    return [...deletedInTables_]
}