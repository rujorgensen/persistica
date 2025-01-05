import objectHash from 'object-hash';

/**
 * 
 * @param { Map<string, Set<any>> } objectStoreNames 
 * 
 * @returns { Map<string, string | undefined> } 
 */
export const hashTables = <TTableName>(
    objectStoreNames: Map<TTableName, Set<any>>,
): Map<TTableName, string | undefined> => {
    const map: Map<TTableName, string | undefined> = new Map();

    for (const [tableName, set] of objectStoreNames.entries()) {
        map.set(tableName, hashTable(set) || undefined);
    }

    return map;
};

/**
 * 
 * @param tableName
 * 
 * @returns { string }
 */
const hashTable = (
    tableName: Set<any>,
): string => {
    let hash: string = '';

    for (const a of tableName) {
        hash = objectHash(hash + a.hash);
    }

    return hash;
};