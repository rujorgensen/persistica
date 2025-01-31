import type { PersistenceWrapper, TLocalStoreState } from '../../persistence.wrapper';
import {
    type Observable,
    BehaviorSubject,
    map,
} from 'rxjs';
import objectHash from 'object-hash';
import { hashTables } from '../indexeddb/hash.utils';
import { hashAll } from '../_utils/db.class';
import type { TDateAsString } from '../../../data-types/filter.interfaces';
import { filterNil } from '../../../../utils/rxjs';
import type { TDataType } from '../../synchronizer/synchronizer-state-detector.fn';
import { ListenerHandler } from '../listeners.class';
import { IGNORED_TABLE_NAMES } from '../_utils/ignored-table-names.const';
import type { TDataParsers, TGenericTableName, TUniqueIdentifier } from '../../_types/element.type';

const DATABASE_NAME = 'PERSISTICA' as const;
const DATABASE_VERSION = 6 as const;
const NETWORK_CONFIGURATION_STORE_UID = '_cuid';

// ******************************************************************************
// *** Implementation
// ******************************************************************************
export class IndexedDBStore<TableTypeMap, TableName extends string & keyof TableTypeMap> implements PersistenceWrapper {

    public readonly state$$: Observable<TLocalStoreState>;
    private readonly state_$$: BehaviorSubject<TLocalStoreState> = new BehaviorSubject<TLocalStoreState>(
        'idle'
    );

    public readonly tableHash$$: BehaviorSubject<Map<TGenericTableName, string | undefined> | undefined>;
    public readonly hash$$: Observable<string>;

    private readonly events: ListenerHandler = new ListenerHandler();

    private db_: IDBDatabase | null = null;

    constructor(
        private readonly instantiators: ((
            db: IDBDatabase,
        ) => void)[],

        private readonly tableTypeParser: TDataParsers<TableName>,
        private readonly getUniqueIdentitier: {
            [key in keyof TableTypeMap]: {
                resolve: (element: unknown) => TUniqueIdentifier;
                indexName?: string;     // Is not set on stores
            }
        },
    ) {
        getUniqueIdentitier['NetworkConfigurationStore'] = {
            resolve: (
                element: unknown,
            ): TUniqueIdentifier => {
                return NETWORK_CONFIGURATION_STORE_UID;
            },
        };

        this.state$$ = this.state_$$.asObservable();

        this.tableHash$$ = new BehaviorSubject<Map<TGenericTableName, string | undefined> | undefined>(undefined);
        this.hash$$ = this.tableHash$$
            .pipe(
                map(hashAll),
                filterNil(),
            );
    }

    /**
     * 
     * @param { string } tableName
     * @param { number } index
     * 
     * @returns { Promise<TDataType<T> | undefined> } 
     */
    public async readElementAt<T>(
        tableName: string,
        index: number,
    ): Promise<TDataType<T> | undefined> {
        const store = await this.openObjectStoreTransaction(tableName);

        return new Promise((resolve): void => {

            // Open a cursor on the primary key
            const cursorRequest: IDBRequest<IDBCursorWithValue | null> = store.openCursor();

            cursorRequest.onsuccess = (event) => {
                const cursor: any = (event.target as IDBRequest).result as IDBCursorWithValue | null;

                if (cursor) {
                    // Advance the cursor by `n` steps
                    cursor.advance(index);

                    // When the cursor has advanced, the onsuccess event fires again
                    cursor.onsuccess = (advanceEvent: any) => {
                        const advancedCursor = advanceEvent.target?.result;

                        if (advancedCursor) {
                            // Get the value at the `n`th position
                            console.log('⚡ Value at position n:', advancedCursor.value);
                        } else {
                            console.log('⚡ No value found at the specified position.');
                        }

                        resolve(advanceEvent.target?.result.value);
                    };
                } else {
                    console.log('⚡ No more records in the store.');
                    resolve(undefined);
                }
            };

            cursorRequest.onerror = (event) => {
                console.error('Error opening cursor:', event.target);
            };
        });
    }

    public async readRowCount(
        tableName: string,
    ): Promise<number> {
        const store = await this.openObjectStoreTransaction(tableName);

        return new Promise((resolve): void => {
            const countRequest = store.count();
            countRequest.onsuccess = () => {
                resolve(countRequest.result);
            };
        });
    }

    public async readTableHash(
        tableName: string,
    ): Promise<string | undefined> {
        const store = await this.openObjectStoreTransaction(tableName);

        return new Promise((resolve): void => {
            // Open a cursor on the primary key, then find the last element
            const cursorRequest: IDBRequest<IDBCursorWithValue | null> = store.openCursor(null, 'prev');

            cursorRequest.onsuccess = (event) => {
                const cursor: IDBCursorWithValue | null = (event.target as IDBRequest).result;

                if (cursor) {
                    // Get the value of the last entry
                    console.log('⚡ Last value/hash:', cursor.value, cursor.value.hash);
                    resolve(cursor.value.hash);
                } else {
                    console.log('⚡ No records found in the store.');
                    resolve(undefined);
                }
            };

            cursorRequest.onerror = (event) => {
                console.error('Error opening cursor:', event.target);
            };
        });
    }

    public async readTableRowHash(
        tableName: string,
        rowIndex: number,
    ): Promise<string | undefined> {
        const store = await this.openObjectStoreTransaction(tableName);

        return new Promise((resolve): void => {

            // Open a cursor on the primary key
            const cursorRequest: IDBRequest<IDBCursorWithValue | null> = store.openCursor();

            cursorRequest.onsuccess = (event) => {
                const cursor: any = (event.target as IDBRequest).result as IDBCursorWithValue | null;

                if (cursor) {
                    // Advance the cursor by `n` steps
                    cursor.advance(rowIndex);

                    // When the cursor has advanced, the onsuccess event fires again
                    cursor.onsuccess = (advanceEvent: any) => {
                        const advancedCursor = advanceEvent.target?.result;

                        if (advancedCursor) {
                            // Get the value at the `n`th position
                            console.log('⚡ Value at position n:', advancedCursor.value);

                        } else {
                            console.log('⚡ No value found at the specified position.');
                        }

                        resolve(advanceEvent.target?.result.value);
                    };
                } else {
                    console.log('⚡ No more records in the store.');
                }
            };

            cursorRequest.onerror = (event) => {
                console.error('Error opening cursor:', event.target);
            };
        });
    }

    /**
     * Returns the table names of the database
     * 
     * @returns { ReadonlyArray<string> }
     */
    public readTableNames(

    ): ReadonlyArray<string> {
        return Object.keys(this.tableTypeParser).filter((key) => !IGNORED_TABLE_NAMES.includes(key)) as ReadonlyArray<string>;
    }

    // ******************************************************************************
    // *** Implement Abstract Class
    // ******************************************************************************

    // * Events
    public onCreate = this.events.onCreate.bind(this.events);
    public onUpdate = this.events.onUpdate.bind(this.events);
    public onDelete = this.events.onDelete.bind(this.events);
    public onAnyCreate = this.events.onAnyCreate.bind(this.events);
    public onAnyUpdate = this.events.onAnyUpdate.bind(this.events);
    public onAnyDelete = this.events.onAnyDelete.bind(this.events);
    public onReady = this.events.onDatabaseReady.bind(this.events);
    public onUpgradedAndReady = this.events.onDatabaseUpgradedAndReady.bind(this.events);

    // * CRUD
    public async create<ReturnType>(tableName: TableName, key: ReturnType): Promise<ReturnType>;
    public async create<ReturnType>(tableName: TableName, key: ReadonlyArray<ReturnType>): Promise<ReadonlyArray<ReturnType>>;
    public async create<ReturnType>(
        tableName: TableName,
        o: ReturnType | ReadonlyArray<ReturnType>,
    ): Promise<ReturnType | ReadonlyArray<ReturnType>> {
        const db = await this.init();

        const store = db
            .transaction([tableName], 'readwrite')
            .objectStore(tableName);

        if (Array.isArray(o)) {
            const addRequest = (
                item: ReturnType,
            ) => {
                return new Promise<TUniqueIdentifier>((resolve, reject) => {
                    const request = store.add({
                        hash: objectHash(item),
                        ...item,
                    });

                    request.onsuccess = () => resolve(request.result as IDBValidKey as TUniqueIdentifier);
                    request.onerror = () => reject(new Error('Error inserting item'));
                });
            };

            const requestResults: TUniqueIdentifier[] = await Promise.all(o.map((oo) => addRequest(oo)));

            const createdItems: ReadonlyArray<ReturnType | undefined> = await Promise.all(
                requestResults
                    .map((requestResult: TUniqueIdentifier): Promise<ReturnType | undefined> => this.getParsedItem(tableName, requestResult))
            );

            this.events.emitCreated<any>(tableName, createdItems); // Fix any

            return createdItems
                .filter((r: ReturnType | undefined): r is ReturnType => r !== undefined);
        }

        return new Promise((resolve, reject): void => {
            const request = store.add({
                ...o,
                hash: objectHash(o),
            });

            request.onsuccess = async () => {
                const createdItems: ReturnType | undefined = await this.getParsedItem(tableName, (request.result as IDBValidKey as TUniqueIdentifier));

                if (createdItems === undefined) {
                    reject(new Error('Error creating item(s), could not be read after creation'));
                    return;
                }

                this.events.emitCreated(tableName, [createdItems]);
                resolve(createdItems);
            };

            request.onerror = async () => {
                if (!this.getUniqueIdentitier[tableName]) {
                    throw new Error(`No unique identifier resolver for table "${tableName}"`);
                }

                console.log('⚡🔄 Checking if item already exists');
                const uid: TUniqueIdentifier = this.getUniqueIdentitier[tableName].resolve(o);
                const fallbackResult = await this.read(tableName, uid); // Call your fallback Promise function here.

                console.error('⚡❌ Error setting item: ', JSON.stringify(o));
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
     * @param { TableName }             tableName
     * @param { TUniqueIdentifier }     uid
     * 
     * @returns { Promise<ReturnType | undefined> }
     */
    public read<TableName_ extends string & keyof TDataParsers<TableName>, ReturnType>(
        tableName: TableName_,
        uid: TUniqueIdentifier,
    ): Promise<ReturnType | undefined> {
        if (!this.getUniqueIdentitier[tableName]) {
            throw new Error(`No unique identifier resolver for table "${tableName}"`);
        }

        const indexName: string | undefined = this.getUniqueIdentitier[tableName].indexName;

        return this.getParsedItem<TableName_, ReturnType>(
            tableName,
            uid,
            indexName,
        );
    }

    public async readMany<TableName_ extends string & keyof TDataParsers<TableName>, ReturnType>(
        tableName: TableName_,
    ): Promise<ReadonlyArray<ReturnType>> {
        const db = await this.init();

        return new Promise((resolve, reject): void => {
            const request = db
                .transaction([tableName], 'readonly')
                .objectStore(tableName)
                .getAll()
                ;

            request.onsuccess = (event: Event) => {
                const result: TDateAsString<ReturnType>[] = (event.target as IDBRequest).result;
                console.log('⚡ ✅ Database values read');

                const parsed: ReadonlyArray<ReturnType> = result
                    .map((v: TDateAsString<ReturnType>) => v === undefined ? undefined : this.tableTypeParser[tableName](v));

                resolve(parsed);
            };

            request.onerror = () => {
                reject(new Error('Error getting item'));
            };
        });
    }

    public async rowIterator<ReturnType>(
        tableName: TableName,
        yieldValue: (row: ReturnType) => void,
    ): Promise<void> {
        const db = await this.init();

        const objectStore = db
            .transaction([tableName], 'readonly')
            .objectStore(tableName);

        return new Promise((resolve, reject): void => {
            const openCursor = objectStore.openCursor();

            openCursor.onsuccess = (event: Event) => {
                const cursor: IDBCursorWithValue | null = (event.target as IDBRequest).result as IDBCursorWithValue | null;

                if (cursor) {
                    yieldValue(this.tableTypeParser[tableName](cursor.value));

                    cursor.continue();
                } else {
                    resolve(void 0);
                }
            };

            openCursor.onerror = () => {
                reject(new Error('Error reading item'));
            };
        });
    }

    public async update<ReturnType>(tableName: TableName, key: ReturnType): Promise<ReturnType>;
    public async update<ReturnType>(tableName: TableName, key: ReadonlyArray<ReturnType>): Promise<ReadonlyArray<ReturnType>>;
    public async update<ReturnType>(
        tableName: TableName,
        o_: ReturnType | ReadonlyArray<ReturnType>,
    ): Promise<ReturnType | ReadonlyArray<ReturnType>> {
        const o: ReturnType = o_ as ReturnType;

        const db = await this.init();

        const transaction = db.transaction([tableName], 'readwrite');
        const store = transaction.objectStore(tableName);

        if (Array.isArray(o)) {
            const addRequest = (
                item: ReturnType,
            ) => {
                return new Promise<TUniqueIdentifier>((resolve, reject) => {
                    const request = store.put({
                        ...item,
                        hash: objectHash(item),
                    });

                    request.onsuccess = () => resolve(request.result as IDBValidKey as TUniqueIdentifier);
                    request.onerror = () => reject(new Error('Error inserting item'));
                });
            };

            const requestResults: TUniqueIdentifier[] = await Promise.all(o.map((oo) => addRequest(oo)));

            const createdItems: ReadonlyArray<ReturnType | undefined> = await Promise.all(
                requestResults
                    .map((requestResult: TUniqueIdentifier): Promise<ReturnType | undefined> => this.getParsedItem(tableName, requestResult))
            );

            this.events.emitUpdated<any>(tableName, createdItems); // Fix any

            return createdItems
                .filter((r: ReturnType | undefined): r is ReturnType => r !== undefined);
        }

        return new Promise((resolve, reject): void => {

            if (Array.isArray(o)) {
                throw new Error('Array not supported');
            }

            const request = store
                .put(
                    {
                        ...o,
                        hash: objectHash(o),
                    },
                );

            request.onsuccess = async () => {

                const updated: ReturnType | undefined = await this.getParsedItem(tableName, (request.result as IDBValidKey as TUniqueIdentifier));

                if (updated === undefined) {
                    reject(new Error('Error updating item, could not be read after update'));
                    return;
                }

                this.events.emitUpdated(tableName, [updated]);
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
     * @param { TableName }  tableName
     * @param { string }        key
     *  
     * @returns { Promise<void> } 
     */
    public async delete<ReturnType>(tableName: TableName, key: TUniqueIdentifier): Promise<ReturnType>;
    public async delete<ReturnType>(tableName: TableName, key: TUniqueIdentifier[]): Promise<ReadonlyArray<ReturnType>>;
    public async delete<ReturnType>(
        tableName: TableName,
        key: TUniqueIdentifier | TUniqueIdentifier[],
    ): Promise<ReturnType | undefined | ReadonlyArray<ReturnType>> {
        const db = await this.init();

        if (Array.isArray(key)) {
            const toDelete: ReturnType[] = await this.getParsedItemsByKey(tableName, key);

            return new Promise((resolve, reject): void => {
                const transaction = db.transaction([tableName], 'readwrite');
                const store = transaction.objectStore(tableName);
                const request = store.delete(key);

                request.onsuccess = () => {
                    resolve(toDelete);
                    this.events.emitDeleted(tableName, toDelete);
                };

                request.onerror = () => {
                    reject(new Error(`Error deleting item of type '${tableName}'`));
                };
            });
        }

        const toDelete: ReturnType | undefined = await this.getParsedItem(tableName, key);

        if (toDelete === undefined) {
            return Promise.resolve(undefined);
        }

        return new Promise((resolve, reject): void => {
            const transaction = db.transaction([tableName], 'readwrite');
            const store = transaction.objectStore(tableName);
            const request = store.delete(key);

            request.onsuccess = () => {
                resolve(toDelete);
                this.events.emitDeleted(tableName, [toDelete]);
            };

            request.onerror = () => {
                reject(new Error(`Error deleting item of type '${tableName}'`));
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
                this.state_$$.next('upgrading');
                const db = (event.target as IDBOpenDBRequest).result;

                for (const instantiator of this.instantiators) {
                    instantiator(db);
                }

                // * Table for internal use
                if (!db.objectStoreNames.contains('NetworkConfigurationStore')) {
                    // It appears that an object store has to have a keyPath
                    const dataFrameStore = db.createObjectStore('NetworkConfigurationStore', { keyPath: NETWORK_CONFIGURATION_STORE_UID });
                    dataFrameStore.createIndex(NETWORK_CONFIGURATION_STORE_UID, NETWORK_CONFIGURATION_STORE_UID, { unique: true });

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
                // }
                console.log('⚡ ✅ Database upgraded');

                wasUpgraded = true;

                // MIGRATE
                // if (event.oldVersion < 1) {
                //     // Version 1 is the first version of the database.
                //     const store = db.createObjectStore("books", { keyPath: "isbn" });
                //     const titleIndex = store.createIndex("by_title", "title", { unique: true });
                //     const authorIndex = store.createIndex("by_author", "author");
                // }
                // if (event.oldVersion < 2) {
                //     // Version 2 introduces a new index of books by year.
                //     const bookStore = request.transaction.objectStore("books");
                //     const yearIndex = bookStore.createIndex("by_year", "year");
                // }
                // if (event.oldVersion < 3) {
                //     // Version 3 introduces a new object store for magazines with two indexes.
                //     const magazines = db.createObjectStore("magazines");
                //     const publisherIndex = magazines.createIndex("by_publisher", "publisher");
                //     const frequencyIndex = magazines.createIndex("by_frequency", "frequency");
                // }
            };

            // db.onversionchange = function () {
            //     saveUnsavedData().then(function () {
            //         db.close();
            //         stopUsingTheDatabase();
            //     });

            // function stopUsingTheDatabase() {
            //     // Put the app into a state where it no longer uses the database.
            // }
            // };
            request.onsuccess = async (event: Event) => {

                const db = (event.target as IDBOpenDBRequest).result;

                this.state_$$.next('hashing');

                const objectStoreNames: Set<string> = new Set(
                    Array.from(db.objectStoreNames),
                );

                this.tableHash$$.next(await hashTables(objectStoreNames, db));

                this.state_$$.next('ready');

                console.log('⚡ ✅ Database opened');

                this.db_ = db;

                resolve(db);

                this.events.emitDatabaseReady();

                if (wasUpgraded) {
                    this.events.emitDatabaseUpgradedAndReady();
                }
            };

            request.onerror = () => {
                this.state_$$.next('idle');

                reject(new Error('Error opening IndexedDB'));
            };
        });
    }

    /**
     * 
     * @param { TbleName_ } tableName
     * @param { TUniqueIdentifier } uniqueId
     * @param { string } indexName
     * 
     * @returns { ReturnType | undefined }
     */
    private async getParsedItem<TableName_ extends string & keyof TDataParsers<TableName>, ReturnType>(
        tableName: TableName_,
        uniqueId: TUniqueIdentifier,
        indexName?: string,
    ): Promise<ReturnType | undefined> {
        const db = await this.init();

        return new Promise((resolve, reject): void => {
            const store = db
                .transaction([tableName], 'readonly')
                .objectStore(tableName);

            const request = (
                indexName ?
                    store.index(indexName)
                    :
                    store
            )
                .get(uniqueId);

            request.onsuccess = (event: any) => {
                if (event.target.result === undefined) {
                    resolve(undefined);
                    return;
                }

                const result: ReturnType & { _idx: number, hash: string; } = (event.target as IDBRequest).result;
                const { _idx, hash, ...rest } = result;

                console.log(`⚡ ✅ Database key '${uniqueId}' read from table '${tableName}'`);

                const parsed: ReturnType = result === undefined ? undefined : this.tableTypeParser[tableName](rest);

                resolve(parsed);
            };

            request.onerror = () => {
                reject(new Error('Error getting item'));
            };
        });
    }

    private async getParsedItemsByKey<ReturnType>(
        tableName: TableName,
        nanoIds: TUniqueIdentifier[],
    ): Promise<ReturnType[]> {
        const store = await this.openObjectStoreTransaction(tableName);

        return new Promise((resolve, reject): void => {
            const request = store
                .getAll(nanoIds)
                ;

            request.onsuccess = (event: Event) => {
                const result: TDateAsString<ReturnType>[] = (event.target as IDBRequest).result;
                console.log(`⚡ ✅ Database key '${nanoIds}' read`);

                const parsed: ReturnType[] = result.map((v: TDateAsString<ReturnType>) => this.tableTypeParser[tableName](v));

                resolve(parsed);
            };

            request.onerror = () => {
                reject(new Error('Error getting item'));
            };
        });
    }

    private async openObjectStoreTransaction<TableName extends string>(
        tableName: TableName,
    ): Promise<IDBObjectStore> {
        const db = await this.init();

        return db
            .transaction([tableName], 'readonly')
            .objectStore(tableName);
    }
};
