export interface ISplitSchema {
    enumBlocks: TEnumBlock[];
    modelBlocks: TModelBlock[];
    storeBlocks: TStoreBlock[];
}

export type TEnumBlock = string;
export type TModelBlock = string;
export type TStoreBlock = string;

export const splitSchema = (
    schemaString: string,
): ISplitSchema => {
    return {
        enumBlocks: extractEnums(schemaString),
        modelBlocks: extractModels(schemaString),
        storeBlocks: extractStores(schemaString),
    };
};

function extractStores(
    input: string,
): TStoreBlock[] {
    // Regular expression to match model, store, and enum blocks
    const regex = /(store)\s+\w+\s*\{[^}]*\}/g;

    // Use match to find all occurrences
    const matches = input.match(regex);

    // Return the matched blocks, or an empty array if none found
    return matches || [];
}

function extractModels(
    input: string,
): TModelBlock[] {
    // Regular expression to match model, store, and enum blocks
    const regex = /(model)\s+\w+\s*\{[^}]*\}/g;

    // Use match to find all occurrences
    const matches = input.match(regex);

    // Return the matched blocks, or an empty array if none found
    return matches || [];
}

function extractEnums(
    input: string,
): TEnumBlock[] {
    // Regular expression to match model, store, and enum blocks
    const regex = /(enum)\s+\w+\s*\{[^}]*\}/g;

    // Use match to find all occurrences
    const matches = input.match(regex);

    // Return the matched blocks, or an empty array if none found
    return matches || [];
}