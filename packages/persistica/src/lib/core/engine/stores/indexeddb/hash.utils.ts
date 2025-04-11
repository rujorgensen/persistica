import objectHash from 'object-hash';

export const hashTables = async (
    objectStoreNames: Set<string>,
    db: IDBDatabase,
): Promise<Map<string, string | undefined>> => {
    const tables: IDBDatabaseInfo[] = await indexedDB.databases();
    console.log('⚡ hashTables', { tables: tables.map((a: IDBDatabaseInfo) => `${a.name} v. ${a.version}`) });

    const map: Map<string, string | undefined> = new Map();

    for await (const tableName of [...objectStoreNames]) {
        const hash = await hashTable(tableName, db);

        map.set(tableName, hash || undefined);
    }

    return map;
};

const hashTable = (
    tableName: string,
    db: IDBDatabase,
): Promise<string> => {

    // Open a transaction on the desired object store (table)
    const transaction = db.transaction(tableName, 'readonly');
    const objectStore = transaction.objectStore(tableName);

    // Open a cursor to iterate through all records
    const cursorRequest = objectStore.openCursor();

    let hash: string = '';

    return new Promise((resolve, reject) => {

        cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;

            if (cursor) {
                hash = objectHash(hash + cursor.value.hash);

                // Continue to the next record
                cursor.continue();
            } else {
                // No more records to process
                console.log(`⚡ All entries iterated in table "${tableName}"`);

                resolve(hash);
            }
        };

        cursorRequest.onerror = () => {
            reject('Error opening cursor');
        };
    });

};