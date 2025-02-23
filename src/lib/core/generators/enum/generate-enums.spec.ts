import { expect, describe, it } from 'vitest';
import { parseStringTypeUnionFromEnumBlock, parseStringTypeUnionsFromEnumBlocks } from './generate-enums.js';
import { validSchemaMock } from '../../_mocks/schema.mocks';
import { splitSchema } from '../../schema/split-schema';

describe('generateTypeUnionFromEnum', () => {
    describe('full', () => {
        it('should parse enums', () => {
            const splitSchema_ = splitSchema(validSchemaMock);

            expect(parseStringTypeUnionsFromEnumBlocks(splitSchema_.enumBlocks)).toStrictEqual([
                {
                    enumName: 'VideoDownloadState',
                    definition: `export type VideoDownloadState = 'WAITING' | 'DOWNLOADING' | 'DOWNLOADED' | 'ERROR';`,
                },
            ]);
        });
    });

    it('should generate type union from enum', () => {
        expect(parseStringTypeUnionFromEnumBlock(`enum VideoDownloadState {
                    WAITING
                    DOWNLOADING
                    DOWNLOADED
                    ERROR
                }`),
        ).toBe(`export type VideoDownloadState = 'WAITING' | 'DOWNLOADING' | 'DOWNLOADED' | 'ERROR';`);
    });
});