export const sanitizeString = (
    input: string,
): string => {          // Remove leading and trailing whitespace

    // Replace multiple spaces and tabs (but not newlines) with a single space
    return input
        .replaceAll(/[\t ]+/g, ' ')
        // Trim the spaces at the start and end of each line while preserving newlines
        .replaceAll(/^\s+|\s+$/gm, '')

        .replaceAll('{', '{\n')
        // Add newline after "}"
        .replaceAll('}', '}\n')
        .replaceAll(/^\s*[\n\r]/gm, '')
        .replace(/#.*/, '')
        
        .trim();
};
