export const captureOutput = (
    input: string,
): string => {
    // Regex to capture the word following 'enum' (which is the enum name)
    const match = input.match(/output\s*=\s*["'](.*?)["']/);

    // Return the captured enum name, or null if not found
    const str: string | undefined = match ? match[1] : undefined;

    if (!str) {
        throw new Error('Invalid format: could not detect output name');
    }

    return str;
};