import { sanitizeString } from './_utils/sanitize-string.js';
import { generateFileName } from './file-handling/generate-filename.js';
import { readFile } from './file-handling/read-file.js';
import { writeFile } from './file-handling/write-file.js';
import { type IParsedEnumBlock, parseStringTypeUnionsFromEnumBlocks } from './generators/enum/generate-enums.js';
import { type ISplitSchema, splitSchema } from './schema/split-schema.js';
import { captureOutput } from './_utils/parsers.utils.js';
import {
    type IParsedStoreBlock,
    parseInterfacesFromStoreBlocks,
} from './generators/store/generate-store.js';

export const run = (
    filePath: string,
) => {

    // * 1 Read and parse the file
    const sanitizedFileContent: string = sanitizeString(
        readFile(filePath),
    );

    // * 2 Split the schema into blocks
    const schema: ISplitSchema = splitSchema(
        sanitizedFileContent,
    );

    const outputFolder: string = captureOutput(sanitizedFileContent);

    const importFilesFrom: string[] = [];

    // ******************************************************************************
    // *** Parse Enums
    // ******************************************************************************
    const parsedEnumBlocks: IParsedEnumBlock[] = parseStringTypeUnionsFromEnumBlocks(schema.enumBlocks);
    consola.start(`Parsing ${parsedEnumBlocks.length} enum(s)`);

    for (const parsedBlock of parsedEnumBlocks) {
        const fileName: string = generateFileName(parsedBlock.enumName, 'enum');

        importFilesFrom.push(
            writeFile(
                parsedBlock.definition,
                fileName,
                outputFolder,
                'enum',
            ),
        );
    }

    // ******************************************************************************
    // *** Parse Stores
    // ******************************************************************************
    const parsedStoreBlocks: IParsedStoreBlock[] = parseInterfacesFromStoreBlocks(schema.storeBlocks);
    consola.start(`Parsing ${parsedStoreBlocks.length} stores(s)`);
    for (const parsedBlock of parsedStoreBlocks) {
        const fileName: string = generateFileName(parsedBlock.storeName, 'store');

        importFilesFrom.push(
            writeFile(
                parsedBlock.definition,
                fileName,
                outputFolder,
                'store',
            ),
        );
    }

    // ******************************************************************************
    // *** Parse Models
    // ******************************************************************************
    const parsedModelBlocks: IParsedModelBlock[] = parseInterfacesFromModelBlocks(schema.modelBlocks);
    consola.start(`Parsing ${parsedModelBlocks.length} models(s)`);
    for (const parsedBlock of parsedModelBlocks) {
        const fileName: string = generateFileName(parsedBlock.modelName, 'model');

        importFilesFrom.push(
            writeFile(
                parsedBlock.definition,
                fileName,
                outputFolder,
                'model',
            ),
        );
    }

    consola.success('Done parsing schema file');
    // * Create index.ts
    console.log({ importFilesFrom });
};