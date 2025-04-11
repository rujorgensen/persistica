import type { FieldDef } from '../types.js';

export const generateInstantiator = (
    tableName: string,
    tableDefinition: Record<string, FieldDef>,
): (
    db: IDBDatabase,
) => void => {

    return (
        db: IDBDatabase,
    ) => {

        if (!db.objectStoreNames.contains(tableName)) {
            const dataFrameStore = db.createObjectStore(tableName, { keyPath: '_idx', autoIncrement: true });
            dataFrameStore.createIndex('_idx', '_idx', { unique: true });

            for (const idField of Object.keys(tableDefinition)) {
                dataFrameStore.createIndex(idField, idField, { unique: tableDefinition[idField].id === true });
            }
        }
    }
};
