import type { TStoreBlock } from '../../schema/split-schema.js';
import { BASE_DATA_TYPES } from '../../data-types/base-data-types.js';

export interface IParsedStoreBlock {
    storeName: string;
    definition: string;
}

/**
 * 
 * @param { TStoreBlock[] }  storeBlocks
 * 
 * @returns { IParsedStoreBlock[] }
 */
export const parseInterfacesFromStoreBlocks = (
    storeBlocks: TStoreBlock[],
): IParsedStoreBlock[] => {
    return storeBlocks.map((storeBlock: TStoreBlock) => ({
        storeName: captureStoreName(storeBlock),
        definition: parseInterfaceFromStoreDSL(storeBlock),
    }));
};

/**
 * 
 * @param { TStoreBlock } storeBlock
 * 
 * @returns { string }
 */
export const parseInterfaceFromStoreDSL = (
    storeBlock: TStoreBlock,
): string => {

    // Split the input into trimmed, non-empty lines.
    const lines = storeBlock
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // The first line should be in the format: "store Configuration {"
    const headerRegex = /^store\s+(\w+)\s*\{$/;
    const headerMatch = lines[0].match(headerRegex);
    if (!headerMatch) {
        throw new Error('Invalid input format: Missing or incorrect store header.');
    }
    const interfaceName = headerMatch[1];

    // The last line should be the closing curly brace "}"
    if (lines[lines.length - 1] !== '}') {
        throw new Error('Invalid input format: Missing closing brace "}".');
    }

    // Process each field line (ignoring the first and last lines)
    const fieldLines = lines.slice(1, lines.length - 1);
    const fields = fieldLines.map(line => {
        // Split the line by whitespace. We assume the first token is the field name
        // and the second token is the field type (which might have a trailing '?' if optional).
        const tokens = line.split(/\s+/);
        if (tokens.length < 2) {
            throw new Error(`Invalid field definition: "${line}"`);
        }
        const fieldName = tokens[0];
        const rawType = tokens[1];
        let isOptional = false;
        let typeName = rawType;

        // Check for optional type indicated by "?"
        if (rawType.endsWith('?')) {
            isOptional = true;
            typeName = rawType.slice(0, -1);
        }

        // Map DSL types to TypeScript types.
        let tsType: string;
        switch (typeName) {
            case 'String':
                tsType = 'string';
                break;
            case 'Date':
                tsType = 'Date';
                break;
            case 'Int':
            case 'Float':
                tsType = 'number';
                break;
            default:
                tsType = typeName;
        }

        return { fieldName, tsType, isOptional };
    });

    // Build the interface string.
    const interfaceBody = fields
        .map(field => `    ${field.fieldName}${field.isOptional ? '?' : ''}: ${field.tsType};`)
        .join('\n');

    return `export interface ${interfaceName} {\n${interfaceBody}\n};`;
};

/**
 * 
 * @param { TStoreBlock }    storeBlock
 * 
 * @returns { string }
 */
const captureStoreName = (
    storeBlock: TStoreBlock,
): string => {
    // Regex to capture the word following 'store' (which is the store name)
    const match = RegExp(/store\s+(\w+)/).exec(storeBlock);

    // Return the captured store name, or null if not found
    const str: string | null = match ? (match[1] ?? null) : null;

    if (str === null) {
        throw new Error('Invalid store format: could not detect store name');
    }

    if (BASE_DATA_TYPES.includes(str as any)) {
        throw new Error(`Invalid store name "${str}": store name cannot be a base data type`);
    }

    return str;
};

