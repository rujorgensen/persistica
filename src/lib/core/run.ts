import { sanitizeString } from './_utils/sanitize-string';
import { generateFileName } from './file-handling/generate-filename';
import { readFile } from './file-handling/read-file';
import { writeFile } from './file-handling/write-file';
import { type IParsedEnumBlock, parseStringTypeUnionsFromEnumBlocks } from './generators/generate-enums';
import { type ISplitSchema, splitSchema } from './schema/split-schema';
import { captureOutput } from './_utils/parsers.utils';

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
    console.log({ schema, outputFolder });

    // * 3 Parse 
    const parsedBlocks: IParsedEnumBlock[] = parseStringTypeUnionsFromEnumBlocks(schema.enumBlocks);

    const importFilesFrom: string[] = [];
    for (const parsedBlock of parsedBlocks) {

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

    // * Create index.ts
    console.log({ importFilesFrom });
};