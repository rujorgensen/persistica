import {
    type Observable,
    filter,
    map,
    startWith,
    switchMap,
} from 'rxjs';
import { DemoModel } from './demo.model';
import { DemoInterface } from './demo.interface';
import { Network, THandshakeState } from '../../lib/core/engine/network/network.class';
import { PersisticaWebsocketClient, TConnectionState } from '../../lib/core/engine/websocket/websocket.client';
import { TClientId } from '../../lib/core/engine/network/network.interfaces';
import { NetworkHostInterface } from '../../lib/core/engine/network/network-client-interface.class';
import {
    DummyNetworkServer,
    IndexedDBStore,
    NetworkStore,
    NetworkWebsocketClient,
    Synchronizer,
    TDateAsString,
    TLocalStoreState,
    TSynchronizerState,
} from '@persistica/core';

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

    private readonly store: IndexedDBStore<TTableTypeMap, TDBTableType> = new IndexedDBStore(
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

    // * Models
    public readonly demoModel: DemoModel;

    // * Internal
    private readonly _networkStore: NetworkStore = new NetworkStore(this.store);
    private readonly _synchronizer$$: Observable<Synchronizer>;

    constructor(

    ) {
        this.websocketClient = new PersisticaWebsocketClient(9_000);

        this.network = new Network(
            this._networkStore,
            new DummyNetworkServer(),
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
}