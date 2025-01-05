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
import { TLocalStoreState } from '../persistence.wrapper';
import { NetworkHostInterface } from '../network/network-client-interface.class';
import { TDataType } from './synchronizer-state-detector.fn';
import { findDivergence } from './_utils/find-divergence.fn';
import { TUniqueIdentifier } from '../_types/element.type';

export abstract class SynchronizableStorage {
    public abstract readonly hash$$: Observable<string>;
    public abstract readonly state$$: Observable<TLocalStoreState>;

    public abstract readonly onAnyCreate: (fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void) => void;
    public abstract readonly onAnyUpdate: (fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void) => void;
    public abstract readonly onAnyDelete: (fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void) => void;

    public abstract create<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>;

    public abstract update<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>;

    public abstract delete(
        tableName: string,
        data: TUniqueIdentifier | TUniqueIdentifier[] | TDataType<any> | ReadonlyArray<TDataType<any>>,
    ): Promise<void>;

    public abstract rowIterator(
        tableName: string,
        value: (r: any) => void,
    ): Promise<void>;

    public abstract readTableNames(): ReadonlyArray<string>;

    public abstract readElementAt: <T>(
        tableName: string,
        index: number,
    ) => Promise<TDataType<T> | undefined>;

    /**
     * Gets the number of rows in the table
     * 
     * @param { string } tableName
     * 
     * @returns { Promise<number> }
     */
    public abstract readRowCount(
        tableName: string,
    ): Promise<number>;

    /**
     * 
     * @param { string } tableName
     * 
     * @returns { Promise<string | undefined> }
     */
    public abstract readTableHash(
        tableName: string,
    ): Promise<string | undefined>;

    /**
     * 
     * @param { string } tableName
     * @param { number } rowIndex
     * 
     * @returns { Promise<string | undefined> }
     */
    public abstract readTableRowHash(
        tableName: string,
        rowIndex: number,
    ): Promise<string | undefined>;
}

class NonMatchingVersionsError extends Error {
    constructor() {
        super('Non-matching versions');
    }
}

export type TSynchronizerState =
    'idle' |
    'non-matching-versions' |
    'waiting-for-readyness' |
    'checking-store-states' |
    'synchronizing-table' |
    'synchronized'
    ;

export class Synchronizer {
    public readonly state$$: Observable<TSynchronizerState>;
    private readonly state_$$: BehaviorSubject<TSynchronizerState> = new BehaviorSubject<TSynchronizerState>('idle');

    private listen: boolean = false;

    constructor(
        private readonly _synchronizableStorage: SynchronizableStorage,
        private readonly _networkHostInterface: NetworkHostInterface,
    ) {
        this.state$$ = this.state_$$.asObservable();

        this.state_$$.next('waiting-for-readyness');
        // 1. Detect version of both persisted stores
        // 2. Detect the state of the storages
        this.waitForReadyness$$()
            .pipe(
                switchMap(() => {
                    this.state_$$.next('checking-store-states');

                    return combineLatest([
                        this._synchronizableStorage.hash$$.pipe(tap((a: string) => console.log('local hash is', a))),
                        this._networkHostInterface.databaseHash$$.pipe(tap((a: string) => console.log('remote hash is', a))),
                    ])
                        .pipe(
                            take(10),

                            switchMap(([localHash, remoteHash]: [string, string]) => {
                                if (localHash === remoteHash) {
                                    this.state_$$.next('synchronized');

                                    return of(void 0);
                                }

                                // Read the number of rows in each table
                                return forkJoin(this._synchronizableStorage.readTableNames()
                                    .map((tableName: string) => combineLatest([
                                        from(this._synchronizableStorage.readTableHash(tableName)),
                                        from(this._networkHostInterface.readTableHash(tableName)),
                                    ])
                                        .pipe(
                                            map(async ([localTableHash, remoteTableHash]: [string | undefined, string | undefined]) => {
                                                if (localTableHash !== remoteTableHash) {
                                                    console.log(`${tableName} is out of sync, synchronizing`);
                                                    this.state_$$.next('synchronizing-table');

                                                    await this.synchronizeTable(
                                                        tableName,
                                                    );
                                                }

                                                return void 0;
                                            }),
                                        ),
                                    ))
                                    .pipe(
                                        map(() => {

                                            return void 0;
                                        }),
                                    )
                                    ;
                            }),

                            // map(async ([localHash, remoteHash]: [string, string]) => {

                            //     if (localHash === remoteHash) {
                            //         this.state_$$.next('synchronized');

                            //         return;
                            //     }

                            //     this.state_$$.next('synchronizing');

                            //     await this.synchronizeInBatches(30);
                            // }),
                        );
                }),
            )
            .subscribe({
                next: (): void => {

                    //  this.state_$$.next('synchronized');
                    console.log("DONE");
                },
                error: (error: unknown): void => {
                    if (error instanceof NonMatchingVersionsError) {
                        this.state_$$.next('non-matching-versions');
                    }
                },
            });

        this.liveUpdates();
    }

    private liveUpdates(

    ): void {
        this._synchronizableStorage.onAnyCreate((...args) => this.listen && this._networkHostInterface.create(...args));
        this._synchronizableStorage.onAnyUpdate((...args) => this.listen && this._networkHostInterface.update(...args));
        this._synchronizableStorage.onAnyDelete((
            tableName: string,
            v: ReadonlyArray<TDataType<any>>,
        ) => this.listen && this._networkHostInterface.delete(tableName, v));

        this._networkHostInterface.onCreate((...args) => this.listen && this._synchronizableStorage.create(...args));
        this._networkHostInterface.onUpdate((...args) => this.listen && this._synchronizableStorage.update(...args));
        this._networkHostInterface.onDelete((
            tableName: string,
            v: ReadonlyArray<TDataType<any>>,
        ) => this.listen && this._synchronizableStorage.delete(tableName, v));
    }

    /**
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
                map(([storageIsReady, socketIsReady]: [TLocalStoreState, TLocalStoreState]) => {

                    console.log({ storageIsReady, socketIsReady });

                    return (storageIsReady === 'ready') && socketIsReady === 'ready';
                }),
            )
            ;

        const matchingVersions$$: Observable<boolean> = forkJoin([
            of(1),// this._synchronizableStorage.version$$,
            of(1),// this._synchronizableStorage.version$$,  // this._synchronizationSocket.remoteVersion$$,
        ])
            .pipe(
                map(([storageVersion, socketIVersion]: [number, number]) => {
                    console.log({ storageVersion, socketIVersion });

                    if (storageVersion !== socketIVersion) {
                        throw new NonMatchingVersionsError();
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
     * 
     * @param tableName 
     * @param tableSizes 
     * @returns 
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
        let divergingIndex = 0;
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
