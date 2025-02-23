import { expect, describe, it } from 'vitest';

import { validSchemaMock, validStoreMock } from '../../_mocks/schema.mocks';
import { splitSchema } from '../../schema/split-schema';
import { parseInterfaceFromStoreDSL, parseInterfacesFromStoreBlocks } from './generate-store';


describe('generateTypeUnionFromEnum', () => {
    describe('full', () => {
        it('should parse enums', () => {
            const splitSchema_ = splitSchema(validSchemaMock);
            console.log({ storeBlocks: splitSchema_.storeBlocks });

            expect(parseInterfacesFromStoreBlocks(splitSchema_.storeBlocks)).toStrictEqual([
                {
                    storeName: 'Configuration',
                    definition: `export interface Configuration {
    apiKey?: string;
    rootFolder?: string;
    updatedAt: Date;
};`,
                },
            ]);
        });
    });

    it('should generate type union from enum', () => {
        expect(parseInterfaceFromStoreDSL(validStoreMock),
        ).toBe(`export interface Configuration {
    apiKey?: string;
    rootFolder?: string;
    updatedAt: Date;
};`);
    });
});