/**
 * Implements the local client class.
 */
import type { Observable } from 'rxjs';
import type { TNetworkId } from './engine/network/network.interfaces.js';
import type { TDataParsers, TGenericTableName, TUniqueIdentifier } from './engine/_types/element.type.js';
import type { TLocalStoreState } from './engine/persistence.wrapper.js';
import { IndexedDBStore } from './engine/stores/indexeddb/indexeddb.store.js';

// replace LocalClient with LocalClient2
export class LocalClient2<TableTypeMap> {

    // * States
    public readonly storeState$$: Observable<TLocalStoreState>;

    // * Internal
    protected readonly store: IndexedDBStore<TableTypeMap>;

    constructor(
        private readonly networkId: TNetworkId,
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
    ) {

        this.store = new IndexedDBStore(
            this.networkId,

            // Instantiate models
            this.instantiators,

            // Parse data
            this.tableTypeParser,

            // Return unique identiier
            this.getUniqueIdentitier,
        );

        this.storeState$$ = this.store.state$$;
    }

}