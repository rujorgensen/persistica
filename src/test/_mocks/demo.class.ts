import {
    type Observable,
    filter,
    firstValueFrom,
    map,
    startWith,
    switchMap,
} from 'rxjs';
import { DemoModel } from './demo.model';
import type { DemoInterface } from './demo.interface';
import { Network, type THandshakeState } from '../../lib/core/engine/network/network.class';
import { PersisticaWebsocketClient, type TConnectionState } from '../../lib/core/engine/websocket/websocket.client';
import type { INetworkState, TClientId } from '../../lib/core/engine/network/network.interfaces';
import type { NetworkHostInterface } from '../../lib/core/engine/network/network-client-interface.class';
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

export class Demo {

    // * States
    public readonly storeState$$: Observable<TLocalStoreState>;
    public readonly networkState$$: Observable<THandshakeState>;
    public readonly websocketState$$: Observable<TConnectionState>;
    public readonly synchronizerState$$: Observable<TSynchronizerState>;

    protected readonly websocketClient: PersisticaWebsocketClient;
    private readonly network: Network;

    private readonly store: IndexedDBStore<TTableTypeMap, TDBTableType>;

    // * Models
    public readonly demoModel: DemoModel;

    // * Internal
    private readonly _synchronizer$$: Observable<Synchronizer>;

    constructor(
        private readonly server: PersisticaWebsocketServer,
        private readonly networkState: INetworkState,
    ) {

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
            {
                DemoModel: (
                    _element: unknown,
                ) => {
                    return 'id';
                },
            },
        );

        this.websocketClient = new PersisticaWebsocketClient(9_000);

        this.network = new Network(
            this.networkState,
            new NetworkWebsocketServer(
                this.server,
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
                        console.log(`Deleting ${data.length} element(s) from table "${tableName}" from network client`);

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
                },
            ),
            new NetworkWebsocketClient(this.websocketClient),
        );

        this._synchronizer$$ = this.network
            .networkHostInterfaces$$
            .pipe(
                filter((state: Map<TClientId, NetworkHostInterface>) => state.size > 0),
                map((state: Map<TClientId, NetworkHostInterface>) => {
                    return new Synchronizer(
                        this.store,
                        state.entries().next().value[1],
                    );
                }),
            );

        this.storeState$$ = this.store.state$$;
        this.networkState$$ = this.network.state$$;

        this.websocketState$$ = this.websocketClient.connectionState$$;
        this.synchronizerState$$ = this._synchronizer$$
            .pipe(
                switchMap((a: Synchronizer) => a.state$$),
                startWith('idle' as TSynchronizerState),
            );

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