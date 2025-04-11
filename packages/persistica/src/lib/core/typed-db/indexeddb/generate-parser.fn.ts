import type { TDateAsString } from '../../data-types/filter.interfaces.js';
import type { FieldDef } from '../types.js';

/** 
 * Parse the data from the database 
 */
export const generateParser = <T>(
    tableDefinition: Record<keyof T, FieldDef>,
): (
    value: TDateAsString<T>,
) => T => {
    return (
        value: TDateAsString<T>,
    ): T => {

        for (const property in tableDefinition) {
            const field = tableDefinition[property];

            if (field.type === 'date') {
                (value as any)[property] = new Date(value[property as string] as unknown as string) as unknown as Date;
            }
        }

        return (value as T);
    };
}