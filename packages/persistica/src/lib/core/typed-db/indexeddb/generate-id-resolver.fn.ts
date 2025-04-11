import type { TUniqueIdentifier } from '../../engine/_types/element.type.js';
import type { FieldDef } from '../types.js';

/** 
 * Handle the ID of the item.
 */
export const generateIdResolver = <T>(
    tableDefinition: Record<string, FieldDef>,
): {
    resolve: (element: T) => TUniqueIdentifier;
    indexName: keyof T;
} => {
    const idField: (keyof T) | undefined = Object
        .keys(tableDefinition)
        .find((key) => tableDefinition[key].id === true) as (keyof T) | undefined
        ;

    if (idField === undefined) {
        throw new Error('No ID field found in the table definition.');
    }

    return {
        resolve: (
            element: T,
        ) => {
            return element[idField] as TUniqueIdentifier;
        },

        indexName: idField,
    };
}