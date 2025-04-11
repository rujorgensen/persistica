export type TFileType = 'model' | 'store' | 'enum';

/**
 * 
 * @param { string }    entityName
 * @param { TFileType } fileType
 * 
 * @returns { string }
 */
export const generateFileName = (
    entityName: string,
    fileType: TFileType,
): string => {
    entityName = convertToKebabCase(entityName);

    switch (fileType) {
        case 'model':
            return `${entityName}.model.ts`;
        case 'store':
            return `${entityName}.store.ts`;
        case 'enum':
            return `${entityName}.enum.ts`;
    }
};

/**
 * 
 * @param { string } input
 * 
 * @returns { string }
 */
const convertToKebabCase = (
    input: string,
): string => {
    return input
        // Replace uppercase letters with '-lowercase' but don't add a hyphen for the first letter
        .replaceAll(/([a-z])([A-Z])/g, '$1-$2')
        // Convert the entire string to lowercase
        .toLowerCase();
};