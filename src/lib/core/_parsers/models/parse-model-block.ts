import { toLowerCamelCase } from "../../_utils/lower-camel-case";
import type { TBaseType } from "../../data-types/base-data-types";
import type { TModelBlock } from "../../schema/split-schema";

// SQLite:

// string → TEXT;
// integer → INTEGER;
// boolean → INTEGER(using 1 and 0);
// float → REAL;

// IndexedDB:

// string → string;
// integer → number;
// boolean → boolean;
// float → number

export interface IModelProperty {
    name: string;
    type: TBaseType | 'UniqueId';
    isOptional: boolean;
}

export interface IParsedModelBlock {
    modelName: string;
    properties: IModelProperty[];
}

export const parseModelBlock = (
    modelBlock: TModelBlock,
): IParsedModelBlock => {
    return {
        modelName: toLowerCamelCase(captureModelName(modelBlock)),
        properties: parseProperties(modelBlock),
    };
};

/**
 * 
 * @param { TEnumBlock }    modelBlock
 * 
 * @returns { string }
 */
const parseProperties = (
    modelBlock: TModelBlock,
): IModelProperty[] => {
    const lines = extractLinesBetweenCurlyBraces(modelBlock);

    // Loop through each line and process it
    return lines
        .map((line) => {
            const words = line.split(' ');

            const typeString: string = words[1] as string;
            let type: TBaseType | 'UniqueId' = typeString as TBaseType;
            if (typeString === '@id') {
                type = 'UniqueId';
            }

            return {
                name: words[0] ?? '',
                type: type,
                isOptional: type.at(-1) === '?',
            };
        });
};

/**
 * 
 * @param { string }    input
 * 
 * @returns { string[] } 
 */
function extractLinesBetweenCurlyBraces(
    input: string,
): string[] {
    // Regular expression to match content between '{' and '}'
    const regex = /\{([^}]*)\}/s;  // The 's' flag allows . to match newline characters
    const match = regex.exec(input);

    if (match) {
        // Extract content inside the curly braces
        const content = match[1]?.trim();

        // Split the content by newline to get each line
        const lines = content?.split('\n').map(line => line.trim());

        return lines ?? [];
    }

    return [];
}

const captureModelName = (
    modelBlock: TModelBlock,
): string => {
    // Regex to capture the word following 'enum' (which is the enum name)
    const match = RegExp(/model\s+(\w+)/).exec(modelBlock);

    // Return the captured enum name, or null if not found
    const str: string | null = match ? (match[1] ?? null) : null;

    if (str === null) {
        throw new Error('Invalid model format: could not detect model name');
    }

    return str;
};
