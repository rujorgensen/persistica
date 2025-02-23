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
    // *** Parse Enums
    // ******************************************************************************
    const parsedStoreBlocks: IParsedStoreBlock[] = parseInterfacesFromStoreBlocks(schema.storeBlocks);
    for (const parsedBlock of parsedStoreBlocks) {


        const fileName: string = generateFileName(parsedBlock.storeName, 'enum');

        importFilesFrom.push(
            writeFile(
                parsedBlock.definition,
                fileName,
                outputFolder,
                'store',
            ),
        );
    }


    // * Create index.ts
    console.log({ importFilesFrom });
};