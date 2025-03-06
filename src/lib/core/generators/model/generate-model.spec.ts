import { expect, describe, it } from 'vitest';
import { validSchemaMock, validModelMock, validModelMock2 } from '../../_mocks/schema.mocks';
import { splitSchema } from '../../schema/split-schema';
import { parseInterfaceFromModelDSL, parseInterfacesFromModelBlocks } from './generate-model';

describe('parseInterfacesFromModelBlocks', () => {
    describe('full', () => {
        it('should parse models', () => {
            const splitSchema_ = splitSchema(validSchemaMock);

            expect(parseInterfacesFromModelBlocks(splitSchema_.modelBlocks)).toStrictEqual([
                {
                    modelName: 'YtbChannel',
                    definition: `export interface YtbChannel {
    id: @id;
    channelId: string;
    channelDescription: string;
    createdAt: Date;
};`,
                },
                {
                    modelName: 'YtbVideo',
                    definition: `export interface YtbVideo {
    id: @id;
    videoId: string;
    channelDescription: string;
    watched: boolean;
    createdAt: Date;
    downloadState: EVideoDownloadState;
    downloadPath: string;
};`,
                },
            ]);
        });
    });

    it('should generate interface from DSL #1', () => {
        expect(parseInterfaceFromModelDSL(validModelMock),
        ).toBe(`export interface YtbChannel {
    id: @id;
    channelId: string;
    channelDescription: string;
    createdAt: Date;
};`);
    });

    it('should generate interface from DSL #2', () => {
        expect(parseInterfaceFromModelDSL(validModelMock2),
        ).toBe(`export interface YtbVideo {
    id: @id;
    videoId: string;
    channelDescription: string;
    watched: boolean;
    createdAt: Date;
    downloadState: EVideoDownloadState;
    downloadPath: string;
};`);
    });
});