import * as fs from 'node:fs';

export const readFile = (
    configFilePath: string,
): string => {
    // Read the configuration file (assumed to be JSON for this example)
    const configData = fs.readFileSync(configFilePath, 'utf8');

    return configData;
};
