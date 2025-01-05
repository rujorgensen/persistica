import type { TEnumBlock } from '../schema/split-schema';
import { BASE_DATA_TYPES } from '../data-types/base-data-types';

export interface IParsedEnumBlock {
    enumName: string;
    definition: string;
}

/**
 * 
 * @param { TEnumBlock[] }  enumBlocks
 * 
 * @returns { IParsedEnumBlock[] }
 */
export const parseStringTypeUnionsFromEnumBlocks = (
    enumBlocks: TEnumBlock[],
): IParsedEnumBlock[] => {
    return enumBlocks.map((enumBlock: TEnumBlock) => ({
        enumName: captureEnumName(enumBlock),
        definition: parseStringTypeUnionFromEnumBlock(enumBlock),
    }));
};

/**
 * 
 * @param { TEnumBlock } enumBlock
 * 
 * @returns { string }
 */
export const parseStringTypeUnionFromEnumBlock = (
    enumBlock: TEnumBlock,
): string => {

    // Match the enum name using regex
    const enumNameMatch = RegExp(/enum\s+(\w+)/).exec(enumBlock);
    if (!enumNameMatch) {
        throw new Error('Invalid enum format: could not find enum name');
    }
    const enumName = enumNameMatch[1];

    // Match all the enum values inside the curly braces
    const enumValuesMatch = RegExp(/\{([^}]+)\}/).exec(enumBlock);
    if (!enumValuesMatch) {
        throw new Error('Invalid enum format: could not find enum values');
    }

    // Split the values, trim whitespace, and remove empty values
    const enumValues = enumValuesMatch[1]?.split('\n')
        .map(value => value.trim())
        .filter(value => value !== '');

    // Create the type union string
    const typeUnion = enumValues?.map(value => `'${value}'`).join(' | ');

    // Return the generated type
    return `export type ${enumName} = ${typeUnion};`;
};

/**
 * 
 * @param { TEnumBlock }    enumBlock
 * 
 * @returns { string }
 */
const captureEnumName = (
    enumBlock: TEnumBlock,
): string => {
    // Regex to capture the word following 'enum' (which is the enum name)
    const match = RegExp(/enum\s+(\w+)/).exec(enumBlock);

    // Return the captured enum name, or null if not found
    const str: string | null = match ? (match[1] ?? null) : null;

    if (str === null) {
        throw new Error('Invalid enum format: could not detect enum name');
    }

    if (BASE_DATA_TYPES.includes(str as any)) {
        throw new Error(`Invalid enum name "${str}": enum name cannot be a base data type`);
    }

    return str;
};

