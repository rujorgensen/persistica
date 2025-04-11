import type { TUniqueIdentifier } from '../engine/_types/element.type.js';
import { IndexedDBStore } from '../engine/stores/indexeddb/indexeddb.store.js';
import type { DefineTable } from './types.js';

export const createTypedDB = (
    tableName: string,
    tables: typeof DefineTable,
): IndexedDBStore<tableName infer T > => {

    let getUniqueId: {
        [key in keyof typeof tables]: {
            resolve: (element: unknown) => TUniqueIdentifier;
            indexName?: string;     // Is not set on stores
        }
    } = {};

    for (const table of tables.fields.keys()) {
        const tableName = table.name as keyof typeof tables;

        (getUniqueId as any)[tableName] = {
            resolve: (
                element: unknown,
            ): TUniqueIdentifier => {

                return 'dasdsasdadsa';
            },
            indexName: 'dasdsa',
        };
    };

    const db = new IndexedDBStore<keyof typeof tables>(
        'ni-dasdsa',
        [],
        {},
        getUniqueId as any,
    );

    return db;
}