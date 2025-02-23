import {
    type Observable,
    combineLatest,
    filter,
    firstValueFrom,
    from,
    map,
    switchMap,
} from 'rxjs';
import { DemoModel } from './demo.model';
import type { DemoInterface } from './demo.interface';
import { Network, type THandshakeState } from '../../lib/core/engine/network/network.class';
import type { INetworkState, ITableDeletes, TClientId } from '../../lib/core/engine/network/network.interfaces';
import type { NetworkHostInterface } from '../../lib/core/engine/network/network-host-interface.class';
import {
    type TDateAsString,
    type TLocalStoreState,
    type TSynchronizerState,
    type PersisticaWebsocketServer,
    IndexedDBStore,
    NetworkWebsocketClient,
    Synchronizer,
    NetworkWebsocketServer,
} from '@persistica/core';
import type { TDataType } from 'src/lib/core/engine/synchronizer/synchronizer-state-detector.fn';
import { reactToSynchronizationStateChange } from 'src/lib/core/engine/base-line/react-to-synchronization-state.fn';
import { LocalClient } from 'src/lib/core/client.class';

export const instantiate = (
    db: IDBDatabase,
): void => {
    if (!db.objectStoreNames.contains('DemoModel')) {
        const dataFrameStore = db.createObjectStore('DemoModel', { keyPath: '_idx', autoIncrement: true });
        dataFrameStore.createIndex('_idx', '_idx', { unique: true });

        dataFrameStore.createIndex('id', 'id', { unique: true });
        dataFrameStore.createIndex('createdAt', 'createdAt', { unique: false });
    }
};

/** 
 * Parse the data from the database 
 */
export const parser = (
    value: TDateAsString<DemoInterface>,
): DemoInterface => {

    return {
        ...value,
        // Instantiate dates
        createdAt: new Date(value.createdAt),
    };
};

type TTableTypeMap = {
    DemoModel: DemoInterface;
};

type TDBTableType = 'DemoModel';

export class Demo extends LocalClient {

    // * States
    public readonly storeState$$: Observable<TLocalStoreState>;
    public readonly networkState$$: Observable<THandshakeState>;
    public readonly synchronizerState$$: Observable<TSynchronizerState>;

    // * Models
    public readonly demoModel: DemoModel;

    // * Internal
    private readonly network: Network;
    private readonly store: IndexedDBStore<TTableTypeMap, TDBTableType>;
    private readonly _synchronizer$$: Observable<Synchronizer>;

    constructor(
        private readonly server: PersisticaWebsocketServer,
        private readonly networkState: INetworkState,
    ) {
        super({
            webSocketPort: 3_000,
        });

        this.store = new IndexedDBStore(
            this.networkState.networkId,
            // Instantiate models
            [
                instantiate,
            ],

            // Parse data
            {
                DemoModel: parser,
            },

            // Return unique identiier
            <any>{
                DemoModel: (
                    _element: unknown,
                ) => {
                    return 'id';
                },
            },
        );

        this.network = new Network(
            this.networkState,
            new NetworkWebsocketServer(
                this.server.rpcServer,
                {
                    readBatchAt: <T>(
                        tableName: string,
                        index: number,
                        batchSize: number,
                    ): Promise<ReadonlyArray<TDataType<T>>> => {
                        console.log('readBatchAt method not implemented.', { tableName, index, batchSize });

                        throw new Error('readBatchAt method not implemented.');
                    },

                    readElementAt: <T>(
                        tableName: string,
                        index: number,
                    ): Promise<TDataType<T> | undefined> => {
                        console.log('readElementAt method not implemented.', { tableName, index });

                        throw new Error('readElementAt method not implemented.');
                    },

                    create: async <T>(
                        tableName: string,
                        data: ReadonlyArray<T>,
                    ): Promise<void> => {
                        console.log(`Inserting ${data.length} element(s) into table "${tableName}" from network client`);

                        await this.store.create(tableName as any, data, true);
                    },

                    update: async<T>(
                        tableName: string,
                        data: ReadonlyArray<TDataType<T>>,
                    ): Promise<void> => {
                        console.log(`Updating ${data.length} element(s) in table "${tableName}" from network client`);

                        await this.store.update(tableName as any, data, true);
                    },

                    delete: async (
                        tableName: string,
                        data: (string | number)[],
                    ): Promise<void> => {
                        console.log(`Deleting ${data.length} element(s) in table "${tableName}" from network client`);

                        await this.store.delete(tableName as any, data, true);
                    },

                    readDatabaseHash: (
                    ): Promise<string> => firstValueFrom(this.store.hash$$),

                    readRowCount: (
                        tableName: string,
                    ): Promise<number> => {
                        return Promise.resolve(this.store.readRowCount(tableName));
                    },

                    readTableHash: (
                        tableName: string,
                    ): Promise<string | undefined> => {
                        return Promise.resolve(this.store.readTableHash(tableName));
                    },

                    readTableRowHash: (
                        tableName: string,
                        rowIndex: number,
                    ): Promise<string | undefined> => {
                        return Promise.resolve(this.store.readTableRowHash(tableName, rowIndex));
                    },

                    emitSynchronizationState: (
                        state: TSynchronizerState,
                    ): Promise<void> => {
                        return Promise.reject('toimplememtntne');
                    },
                },
            ),
            new NetworkWebsocketClient(this.websocketClient),
        );

        const networkHostInterface$$: Observable<NetworkHostInterface> = this.network.networkHostInterfaces$$
            .pipe(
                filter((state: Map<TClientId, NetworkHostInterface>) => state.size > 0),
                map((state: Map<TClientId, NetworkHostInterface>) => {
                    if (state.size > 1) {
                        throw new Error('Only one network host interface is supported at the moment.');
                    }

                    return state.entries().next().value[1];
                }),
            );

        this._synchronizer$$ = networkHostInterface$$
            .pipe(
                map((networkHostInterface: NetworkHostInterface) => new Synchronizer(
                    [],// ! TODO
                    [],// ! TODO
                    this.store,
                    networkHostInterface,
                ),)
            );


        this.storeState$$ = this.store.state$$;
        this.networkState$$ = this.network.state$$;

        this.synchronizerState$$ = this._synchronizer$$
            .pipe(
                switchMap((a: Synchronizer) => a.state$$),
            );

        // Attach logic to react to synchronization state changes
        combineLatest([
            this.synchronizerState$$,
            networkHostInterface$$,
            from(this.network.networkStore.read())
        ])
            .subscribe({
                next: ([synchronizer, networkHostInterface, networkState]: [Synchronizer, NetworkHostInterface, INetworkState]) => {
                    reactToSynchronizationStateChange(
                        networkHostInterface.clientId,
                        networkState.tableDeletes,
                        (
                            cb: (synchronizerState: TSynchronizerState) => Promise<void>,
                        ) => {
                            synchronizer.state$$.subscribe({ next: cb });
                        },

                        (

                        ) => {
                            return Promise.resolve(networkState.knownPeers.map((knownPeer: { clientId: TClientId }) => knownPeer.clientId));
                        },

                        (
                            deletes: ReadonlyArray<Readonly<ITableDeletes>>,
                        ) => {
                            return this.network.networkStore.updateDeleteLog(deletes);
                        },
                    );
                },
                error: () => { },
            });

        this.demoModel = new DemoModel(this.store);
    }

    public joinNetwork(

    ): void {
        this.network.sendJoinNetworkRequest();
    }

    /**
     * Disconnect from server.
     * 
     * @returns { void }
     */
    public disconnect(

    ): void {
        this.network.disconnect();
    }
}