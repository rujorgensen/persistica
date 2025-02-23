import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TFileType } from './generate-filename.js';

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
            importFrom = path.join('client', 'models', fileName);
            fullPath = path.join(folderName, 'client', 'models', fileName);
            break;
        case 'store':
            importFrom = path.join('client', 'stores', fileName);
            fullPath = path.join(folderName, 'client', 'stores', fileName);
            break;
        case 'enum':
            importFrom = path.join('client', 'enums', fileName);
            fullPath = path.join(folderName, 'client', 'enums', fileName);
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
