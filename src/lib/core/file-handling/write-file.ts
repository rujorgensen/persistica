import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TFileType } from './generate-filename.js';

/**
 * Writes a file to disc and returns its path.
 * 
 * @param { string } fileContent
 * @param { string } fileName
 * @param { string } folderName
 * @param { TFileType } fileType
 * 
 * @returns { string }
 */
export const writeFile = (
    fileContent: string,
    fileName: string,
    folderName: string,
    fileType: TFileType,
): string => {
    console.log(`Writing file: ${fileName}`);

    let importFrom: string;
    let fullPath: string;
    switch (fileType) {
        case 'model':
            importFrom = path.join(fileName);
            fullPath = path.join(folderName, fileName);
            break;
        case 'store':
            importFrom = path.join(fileName);
            fullPath = path.join(folderName, fileName);
            break;
        case 'enum':
            importFrom = path.join(fileName);
            fullPath = path.join(folderName, fileName);
            break;
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Creating the directory if it doesn't exist
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    // Write the file to disk
    fs.writeFileSync(fullPath, fileContent);

    console.log(`File written: "${fullPath}", import it from "${importFrom}"`);

    return importFrom;
};
