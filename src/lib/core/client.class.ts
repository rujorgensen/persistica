/**
 * Implements the local client class.
 */
import {
    type Observable,
    combineLatest,
    filter,
    firstValueFrom,
    from,
    map,
    switchMap,
} from 'rxjs';
import {
    type TConnectionState,
    PersisticaWebsocketClient,
} from './engine/websocket/websocket.client.js';
import { Network, type THandshakeState } from './engine/network/network.class.js';
import type { INetworkState, ITableDeletes, TClientId } from './engine/network/network.interfaces.ts';
import { NetworkWebsocketServer } from './engine/websocket/server/network.server.js';
import type { TDataType } from './engine/synchronizer/synchronizer-state-detector.fn.ts';
import { IndexedDBStore } from './engine/stores/indexeddb/indexeddb.store.js';
import type { TDataParsers, TGenericTableName, TUniqueIdentifier } from './engine/_types/element.type.ts';
import { Synchronizer, type TSynchronizerState } from "./engine/synchronizer/synchronizer.js";
import { NetworkWebsocketClient } from './engine/websocket/client/network.client.js';
import type { RPCServer } from './engine/websocket/rpc/rpc-server.class.ts';
import type { TLocalStoreState } from './engine/persistence.wrapper.ts';
import type { NetworkHostInterface } from './engine/network/network-host-interface.class.ts';
import { reactToSynchronizationStateChange } from './engine/base-line/react-to-synchronization-state.fn.js';
import type { NetworkServer } from './engine/network/abstract-network.server.ts';

class DummyNetworkServer implements NetworkServer {

    public onIncommingConnectionRequest(
        fn: (
            peerNetworkState: INetworkState,
        ) => INetworkState,
    ): void {

        console.error('onIncommingConnectionRequest not implemented should it?');
    }

    public onEmitSynchronizationState(
        fn: (
            state: TSynchronizerState,
        ) => void,
    ): void {
        console.error('onEmitSynchronizationState not implemented should it?');
    }
}

export class LocalClient<TableTypeMap, TDBTableType extends string & keyof TableTypeMap> {

    // * States
    public readonly websocketState$$: Observable<TConnectionState>;
    public readonly storeState$$: Observable<TLocalStoreState>;
    public readonly networkState$$: Observable<THandshakeState>;
    public readonly synchronizerState$$: Observable<TSynchronizerState>;

    // * Internal
    protected readonly store: IndexedDBStore<TableTypeMap, TDBTableType>;

    // * Core
    private readonly websocketClient: PersisticaWebsocketClient;
    private readonly network: Network;
    private readonly synchronizer$$: Observable<Synchronizer>;

    constructor(
        private readonly configuration: {
            webSocketPort: number
        },
        private readonly networkState: INetworkState,
        private readonly instantiators: ((
            db: IDBDatabase,
        ) => void)[],
        private readonly tableTypeParser: TDataParsers<TGenericTableName>,
        private readonly getUniqueIdentitier: {
            [key in keyof TableTypeMap]: {
                resolve: (element: unknown) => TUniqueIdentifier;
                indexName?: string;     // Is not set on stores
            }
        },

        // REMOVE!!
        private readonly rpcServer?: RPCServer<'emitSynchronizationState' | 'joinNetwork'>,
    ) {
        this.websocketClient = new PersisticaWebsocketClient(this.configuration.webSocketPort);
        this.websocketState$$ = this.websocketClient.connectionState$$;

        this.store = new IndexedDBStore(
            this.networkState.networkId,

            // Instantiate models
            this.instantiators,

            // Parse data
            this.tableTypeParser,

            // Return unique identiier
            this.getUniqueIdentitier,
        );

        this.network = new Network(
            this.networkState,
            !this.rpcServer ?
                new DummyNetworkServer()
                :
                new NetworkWebsocketServer(
                    this.rpcServer, // !REMOVE
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

        this.storeState$$ = this.store.state$$;
        this.networkState$$ = this.network.state$$;

        const networkHostInterface$$: Observable<NetworkHostInterface> = this.network.networkHostInterfaces$$
            .pipe(
                filter((state: Map<TClientId, NetworkHostInterface>) => state.size > 0),
                map((state: Map<TClientId, NetworkHostInterface>) => {
                    if (state.size > 1) {
                        throw new Error('Only one network host interface is supported at the moment.');
                    }

                    return (state.entries().next().value?.[1]) as NetworkHostInterface;
                }),
            );


        this.synchronizer$$ = networkHostInterface$$
            .pipe(
                map((networkHostInterface: NetworkHostInterface) => new Synchronizer(
                    [],// ! TODO
                    [],// ! TODO
                    this.store,
                    networkHostInterface,
                ),)
            );

        this.synchronizerState$$ = this.synchronizer$$
            .pipe(
                switchMap((a: Synchronizer) => a.state$$),
            );

        // Attach logic to react to synchronization state changes
        combineLatest([
            this.synchronizer$$,
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