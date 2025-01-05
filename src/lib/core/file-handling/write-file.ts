import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TFileType } from './generate-filename';

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
            fullPath = path.join(folderName, 'dist', 'client', 'models', fileName);
            break;
        case 'store':
            importFrom = path.join('client', 'stores', fileName);
            fullPath = path.join(folderName, 'dist', 'client', 'stores', fileName);
            break;
        case 'enum':
            importFrom = path.join('client', 'enums', fileName);
            fullPath = path.join(folderName, 'dist', 'client', 'enums', fileName);
            break;
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Write the file to disk
    fs.writeFileSync(fullPath, fileContent);

    console.log(`File written: "${fullPath}", import it from "${importFrom}"`);

    return importFrom;
};
