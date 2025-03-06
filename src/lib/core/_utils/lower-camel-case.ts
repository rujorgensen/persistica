

/**
 * 
 * @param { string } input
 * 
 * @returns { string }
 */
export const toLowerCamelCase = (
    input: string,
): string => {
    return input
        .replaceAll('-', '')
        .split(/[\s-_]+|(?=[A-Z][a-z])/g)  // Split by spaces, dashes, underscores, or capital letters followed by lowercase
        .map((word, index) => {
            if (index === 0) {
                return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase(); // Lowercase the first word
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize the first letter of subsequent words
        })
        .join('');
};
