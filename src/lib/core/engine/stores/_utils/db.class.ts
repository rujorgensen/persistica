import objectHash from 'object-hash';
import { IGNORED_TABLE_NAMES } from './ignored-table-names.const';
import { TGenericTableName } from '../../_types/element.type';

/**
 * 
 * @param { Map<TGenericTableName, string | undefined> | undefined } map
 * @returns 
 */
export const hashAll = (
    map: Map<TGenericTableName, string | undefined> | undefined,
): string | undefined => {
    if (!map) {
        return undefined;
    }

    return objectHash(Array.from(map.entries())
        .filter(([key]) => !IGNORED_TABLE_NAMES.includes(key))
        .sort()
        .map(([key, value]) => `${key}:${value}`)
        .join(';')
    );
};


