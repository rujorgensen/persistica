import { ListenerHandler } from '../listeners.class';
import type {
    INetworkState,
    TNetworkId,
} from '../../network/network.interfaces';
import {
    type Observable,
    bindCallback,
    filter,
} from 'rxjs';
import type { IChangeSource } from '../../change-event.util';

const DATABASE_NAME = 'PERSISTICA-NETWORKS' as const;
const TABLE_NAME = 'NetworkConfigurationStore' as const;
const DATABASE_VERSION = 1 as const;

// ******************************************************************************
// *** Implementation
// ******************************************************************************
export class IndexedDBNetworkStore {

    private readonly events: ListenerHandler = new ListenerHandler();

    private db_: IDBDatabase | null = null;

    private readonly eventSource: IChangeSource<INetworkState>;

    constructor() {
        this.eventSource = {
            onCreate$$: bindCallback(
                (cb: (elements: ReadonlyArray<INetworkState>) => void) => this.events.onCreate(TABLE_NAME, (a: ReadonlyArray<INetworkState>) => cb(a))
            )(),
            onUpdate$$: bindCallback(
                (cb: (elements: ReadonlyArray<INetworkState>) => void) => this.events.onUpdate(TABLE_NAME, (a: ReadonlyArray<INetworkState>) => cb(a))
            )(),
            onDelete$$: bindCallback(
                (cb: (elements: ReadonlyArray<INetworkState>) => void) => this.events.onDelete(TABLE_NAME, (a: ReadonlyArray<INetworkState>) => cb(a))
            )(),
        };
    }
    // ******************************************************************************
    // *** Implement Abstract Class
    // ******************************************************************************

    // * Events
    public onUpdate(
        networkId: TNetworkId,
    ): Observable<INetworkState> {
        return this.eventSource.onUpdate$$
            .pipe(
                filter((networkState: INetworkState) => networkState.networkId === networkId),
            );
    }

    // * CRUD
    public async create(
        networkState: INetworkState,
    ): Promise<INetworkState> {
        const db = await this.init();

        const store = db
            .transaction([TABLE_NAME], 'readwrite')
            .objectStore(TABLE_NAME);

        return new Promise((resolve, reject): void => {
            const request = store.add(networkState);

            request.onsuccess = async () => {
                const createdItems: INetworkState | undefined = await this.getParsedItem(networkState.networkId);

                if (createdItems === undefined) {
                    reject(new Error('Error creating item(s), could not be read after creation'));
                    return;
                }

                this.events.emitCreated(TABLE_NAME, [createdItems]);
                resolve(createdItems);
            };

            request.onerror = async () => {
                console.log('⚡🔄 Checking if item already exists');
                const fallbackResult = await this.read(networkState.networkId);

                console.error('⚡❌ Error setting item: ', JSON.stringify(networkState));
                if (fallbackResult) {
                    reject(new Error('Error, item already exists'));
                    return;
                }

                reject(new Error('Error setting item'));
            };
        });
    }

    /**
     * 
     * @param { TUniqueIdentifier }     uid
     * 
     * @returns { Promise<INetworkState | undefined> }
     */
    public read(
        networkId: TNetworkId,
    ): Promise<INetworkState | undefined> {
        return this.getParsedItem(
            networkId,
        );
    }

    public async readMany(
    ): Promise<ReadonlyArray<INetworkState>> {
        const db = await this.init();

        return new Promise((resolve, reject): void => {
            const request = db
                .transaction([TABLE_NAME], 'readonly')
                .objectStore(TABLE_NAME)
                .getAll()
                ;

            request.onsuccess = (event: Event) => {
                const result: INetworkState[] = (event.target as IDBRequest).result;
                console.log('⚡ ✅ Database values read');

                resolve(result
                    .map((v: INetworkState) => v === undefined ? undefined : v));
            };

            request.onerror = () => {
                reject(new Error('Error getting item'));
            };
        });
    }

    public async update(
        networkState: INetworkState,
    ): Promise<INetworkState> {
        const db = await this.init();

        const transaction = db.transaction([TABLE_NAME], 'readwrite');
        const store = transaction.objectStore(TABLE_NAME);

        return new Promise((resolve, reject): void => {
            const request = store.put(networkState);

            request.onsuccess = async () => {

                const updated: INetworkState | undefined = await this.getParsedItem(networkState.networkId);

                if (updated === undefined) {
                    reject(new Error('Error updating item, could not be read after update'));
                    return;
                }

                this.events.emitUpdated(TABLE_NAME, [updated]);

                resolve(updated);
            };

            request.onerror = () => {
                reject(new Error('Error updating item'));
            };
        });
    }

    /**
     * ! Does NOT throw on non existing elements
     * 
     * @param { TNetworkId }    networkId
     *  
     * @returns { Promise<void> } 
     */
    public async delete(
        networkId: TNetworkId,
    ): Promise<INetworkState | undefined> {
        const db = await this.init();

        const toDelete: INetworkState | undefined = await this.getParsedItem(networkId);

        if (toDelete === undefined) {
            return Promise.resolve(undefined);
        }

        return new Promise((resolve, reject): void => {
            const transaction = db.transaction([TABLE_NAME], 'readwrite');
            const store = transaction.objectStore(TABLE_NAME);
            const request = store.delete(networkId);

            request.onsuccess = () => {
                resolve(toDelete);
                this.events.emitDeleted(TABLE_NAME, [toDelete]);
            };

            request.onerror = () => {
                reject(new Error(`Error deleting item of type '${TABLE_NAME}'`));
            };
        });
    }

    // ******************************************************************************
    // *** Internal Helpers
    // ******************************************************************************

    /**
     * Initializes the database
     * 
     * @returns { Promise<IDBDatabase> }
     */
    private init(

    ): Promise<IDBDatabase> {

        if (this.db_) {
            return Promise.resolve(this.db_);
        }

        return new Promise((resolve, reject): void => {
            const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

            let wasUpgraded: boolean = false;
            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // * Table for internal use
                if (!db.objectStoreNames.contains('NetworkConfigurationStore')) {
                    // It appears that an object store has to have a keyPath
                    const dataFrameStore = db.createObjectStore('NetworkConfigurationStore', { keyPath: 'networkId' });
                    dataFrameStore.createIndex('networkId', 'networkId', { unique: true });

                    dataFrameStore.createIndex('networkKey', 'networkKey', { unique: true });
                    dataFrameStore.createIndex('clientId', 'clientId', { unique: true });
                    dataFrameStore.createIndex('version', 'version', { unique: true });
                    dataFrameStore.createIndex('knownPeers', 'knownPeers', { unique: true });
                    dataFrameStore.createIndex('deletes', 'deletes', { unique: true });
                }

                // Transaction completed
                // objectStore.transaction.oncompleted = (e) => {
                //     console.log('⚡ Object store "student" created');
                // 
                console.log('⚡ ✅ Database upgraded');

                wasUpgraded = true;
            };

            request.onsuccess = async (event: Event) => {

                const db = (event.target as IDBOpenDBRequest).result;


                console.log('⚡ ✅ Database opened');

                this.db_ = db;

                resolve(db);

                this.events.emitDatabaseReady();

                if (wasUpgraded) {
                    this.events.emitDatabaseUpgradedAndReady();
                }
            };

            request.onerror = () => {
                reject(new Error('Error opening IndexedDB'));
            };
        });
    }

    /**
     * Parses an item from the database
     * 
     * @param { TNetworkId } networkId
     * 
     * @returns { INetworkState | undefined }
     */
    private async getParsedItem(
        networkId: TNetworkId,
    ): Promise<INetworkState | undefined> {
        const db = await this.init();

        return new Promise((resolve, reject): void => {
            const store = db
                .transaction([TABLE_NAME], 'readonly')
                .objectStore(TABLE_NAME);

            const request = store.get(networkId);

            request.onsuccess = (event: any) => {
                if (event.target.result === undefined) {
                    resolve(undefined);
                    return;
                }

                const result: INetworkState = (event.target as IDBRequest).result;

                console.log(`⚡ ✅ Database key '${networkId}' read from table network store`);

                resolve(result);
            };

            request.onerror = () => {
                reject(new Error('Error getting item'));
            };
        });
    }
}