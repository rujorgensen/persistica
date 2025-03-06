import {
    type Observable,
    BehaviorSubject,
    combineLatest,
    filter,
    forkJoin,
    from,
    map,
    of,
    switchMap,
    take,
    tap,
} from 'rxjs';
import type { TLocalStoreState } from '../persistence.wrapper';
import type { NetworkHostInterface } from '../network/network-host-interface.class';
import type { TDataType } from './synchronizer-state-detector.fn';
import { findDivergence } from './_utils/find-divergence.fn';
import type { ITableDeletes } from '../network/network.interfaces';
import { replayDeletes } from './_utils/sync-deletes.fn';
import type { SynchronizableStorage } from './abstract-synchronizable-storage.class';

class NonMatchingVersionsError extends Error {
    constructor(
        private readonly versionA: number,
        private readonly versionB: number,
    ) {
        super(`Non-matching versions: '${versionA}'/'${versionB}'`);
    }
}

export type TSynchronizerState =
    'waiting-for-readyness' |
    'non-matching-versions' |
    'synchronizing-deletes' |
    //  'deletes-synchronized' |
    'checking-store-states' |
    'synchronizing-table' |
    'synchronized'
    ;

export class Synchronizer {
    public readonly state$$: Observable<TSynchronizerState>;
    private readonly state_$$: BehaviorSubject<TSynchronizerState> = new BehaviorSubject<TSynchronizerState>('waiting-for-readyness');

    private listen: boolean = false;

    constructor(
        private readonly localTableDeletes: ReadonlyArray<Readonly<ITableDeletes>>,
        private readonly remoteTableDeletes: ReadonlyArray<Readonly<ITableDeletes>>,

        private readonly _synchronizableStorage: SynchronizableStorage,
        private readonly _networkHostInterface: NetworkHostInterface,
    ) {
        this.state$$ = this.state_$$.asObservable();

        this.state$$.subscribe({ next: async (state: TSynchronizerState) => await this._networkHostInterface.emitSynchronizationState(state) });

        // 1. Detect version of both persisted stores
        // 2. Detect the state of the storages
        this.waitForReadyness$$()
            .pipe(
                switchMap(() => {
                    this.state_$$.next('synchronizing-deletes');

                    return from(replayDeletes(
                        this.localTableDeletes,
                        this.remoteTableDeletes,
                        this._synchronizableStorage.delete.bind(this._synchronizableStorage),
                        this._networkHostInterface.delete.bind(this._networkHostInterface),
                    ));
                }),
                switchMap(() => {
                    this.state_$$.next('checking-store-states');

                    return combineLatest([
                        this._synchronizableStorage.hash$$.pipe(tap((a: string) => console.log('local hash is', a))),
                        this._networkHostInterface.databaseHash$$.pipe(tap((a: string) => console.log('remote hash is', a))),
                    ])
                        .pipe(
                            switchMap(([localHash, remoteHash]: [string, string]) => {
                                if (localHash === remoteHash) {
                                    this.state_$$.next('synchronized');

                                    return of(void 0);
                                }

                                // Read the number of rows in each table
                                return forkJoin(this._synchronizableStorage.readTableNames()
                                    .map((tableName: string) => from(
                                        Promise.all([
                                            this._synchronizableStorage.readTableHash(tableName),
                                            this._networkHostInterface.readTableHash(tableName),
                                        ]),
                                    )
                                        .pipe(
                                            map(async ([localTableHash, remoteTableHash]: [string | undefined, string | undefined]) => {
                                                if (localTableHash !== remoteTableHash) {
                                                    console.log(`The table "${tableName}" is out of sync, synchronizing`);
                                                    this.state_$$.next('synchronizing-table');

                                                    await this.synchronizeTable(
                                                        tableName,
                                                    );
                                                }

                                                return void 0;
                                            }),
                                        ),
                                    ));
                            }),
                        );
                }),
            )
            .subscribe({
                next: (): void => {
                    this.listen = true;
                    //   this.state_$$.next('synchronized');
                    console.log("DONE synchronizing");
                },
                error: (error: unknown): void => {
                    if (error instanceof NonMatchingVersionsError) {
                        this.state_$$.next('non-matching-versions');
                    }
                },
            });

        this.bindToLiveUpdates();
    }

    /**
     * Start detecting live updates
     * 
     * @returns { void }
     */
    private bindToLiveUpdates(

    ): void {
        this._synchronizableStorage.onAnyCreate((...args) => this.listen && this._networkHostInterface.create(...args));
        this._synchronizableStorage.onAnyUpdate((...args) => this.listen && this._networkHostInterface.update(...args));
        this._synchronizableStorage.onAnyDelete((...args) => this.listen && this._networkHostInterface.delete(...args));

        this._networkHostInterface.onCreate((...args) => this.listen && this._synchronizableStorage.create(...args));
        this._networkHostInterface.onUpdate((...args) => this.listen && this._synchronizableStorage.update(...args));
        this._networkHostInterface.onDelete((...args) => this.listen && this._synchronizableStorage.delete(...args));
    }

    /**
     * Wait for the local storage and the network host to be ready
     * 
     * @returns { Observable<boolean> }
     */
    private waitForReadyness$$(

    ): Observable<boolean> {
        const bothReady$$: Observable<boolean> = combineLatest([
            this._synchronizableStorage.state$$.pipe(map(() => 'ready' as TLocalStoreState), take(1)),
            this._synchronizableStorage.state$$.pipe(map(() => 'ready' as TLocalStoreState), take(1)),  // this.networkHostInterface$$.pipe(switchMap((a: NetworkHostInterface) => a.databaseHash$$)),
        ])
            .pipe(
                map(([storageIsReady, socketIsReady]: [TLocalStoreState, TLocalStoreState]) =>
                    (storageIsReady === 'ready') && (socketIsReady === 'ready'),
                ),
            );

        const matchingVersions$$: Observable<boolean> = forkJoin([
            of(1),// this._synchronizableStorage.version$$,
            of(1),// this._synchronizableStorage.version$$,  // this._synchronizationSocket.remoteVersion$$,
        ])
            .pipe(
                map(([storageVersion, socketIVersion]: [number, number]) => {
                    if (storageVersion !== socketIVersion) {
                        throw new NonMatchingVersionsError(storageVersion, socketIVersion);
                    }

                    return storageVersion === socketIVersion;
                }),
            );

        return forkJoin([
            bothReady$$,
            matchingVersions$$,
        ])
            .pipe(
                map(([bothReady, bothSameVersion]: [boolean, boolean]): boolean => (bothReady && bothSameVersion)),
                filter((readyness: boolean): boolean => readyness === true),
            )
            ;
    }

    /**
     * Synchronizes a table
     * 
     * @param { string } tableName
     * 
     * @returns { Promise<void> } 
     */
    private async synchronizeTable<T>(
        tableName: string,
    ): Promise<void> {

        const tableSizes: {
            localRowCount: number;
            remoteRowCount: number,
        } = {
            localRowCount: await this._synchronizableStorage.readRowCount(tableName),
            remoteRowCount: await this._networkHostInterface.readRowCount(tableName),
        };

        // One is completely empty
        if (tableSizes.localRowCount === 0) {
            let offset = 0;
            const batchSize = 30;

            while (true) {
                // Read the batch at the current offset
                const array: ReadonlyArray<TDataType<T>> = await this._networkHostInterface
                    .readBatchAt<T>(
                        tableName,
                        offset,
                        batchSize,
                    );

                // If the returned batch is empty, break the loop as there are no more items to process
                if (array.length === 0) {
                    break;
                }

                this._synchronizableStorage
                    .create(
                        tableName,
                        array,
                    );

                // Update the offset for the next batch
                offset += batchSize;
            }
            return Promise.resolve();
        }

        if (tableSizes.remoteRowCount === 0) {

            const batchSize = 30;
            const batch: Array<any> = [];
            await this._synchronizableStorage.rowIterator(tableName, (
                row: any,
            ) => {
                batch.push(row);

                if (batch.length === batchSize) {
                    this._networkHostInterface
                        .create(
                            tableName,
                            batch,
                        );
                    // Clear the batch after emitting
                    batch.length = 0;
                }
            });

            // Emit any remaining rows in the final batch
            if (batch.length > 0) {
                this._networkHostInterface
                    .create(
                        tableName,
                        batch,
                    );
            }

            return Promise.resolve();
        }

        return this.syncTables(
            tableName,
            tableSizes,
        );
    }

    private async syncTables<T>(
        tableName: string,
        tableSizes: {
            localRowCount: number;
            remoteRowCount: number,
        },
    ): Promise<void> {

        // Find where the tables diverge
        const divergingIndex = 0;

        while (true) {
            const divergenceIndex: number = await findDivergence(
                tableName,
                tableSizes,
                this._synchronizableStorage.readTableRowHash.bind(this._synchronizableStorage),
                this._networkHostInterface.readTableRowHash.bind(this._synchronizableStorage),
            );

            const localRow: TDataType<T> | undefined = await this._synchronizableStorage.readElementAt(tableName, divergenceIndex);
            const remoteRow: TDataType<T> | undefined = await this._networkHostInterface.readElementAt(tableName, divergenceIndex);
        }

        return Promise.resolve();
    }

}
