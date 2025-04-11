
export const validateModel = (
    modelString: string,
): void => {
    // Split the input by newline characters
    const lines = modelString.split(/\r?\n/);

    lines.forEach((line, index) => {
        // Use a regex to extract all annotation tokens (e.g., @id, @default)
        const annotationRegex = /@\w+/g;
        const annotations = line.match(annotationRegex);

        // Only validate lines that contain an @id annotation.
        if (annotations?.includes('@id')) {
            // If @id is not the first annotation, record an error.
            const elements: string[] = line.trim().split(/\s+/);

            if (elements.length > 2) {
                throw new Error(`Line ${index + 1}: @id must be the only annotation.`);
            }
        }
    });
}
