import { expect, describe, it } from 'vitest';
import { splitSchema } from './split-schema';
import { validSchemaMock } from '../_mocks/schema.mocks';

describe('split-schema', () => {
    it('should split schema', () => {

        expect(splitSchema(validSchemaMock)).toStrictEqual({
            enumBlocks: [`enum VideoDownloadState {
WAITING
DOWNLOADING
DOWNLOADED
ERROR
}`],
            modelBlocks: [`model YtbChannel {
id @id
channelId String @unique
channelDescription String
createdAt Date @default(now())
}`,
                `model YtbVideo {
id @id
videoId String @unique
channelDescription String
watched Boolean @default(false)
createdAt Date @default(now())
downloadState VideoDownloadState @default(WAITING)
downloadPath String
}`],
            storeBlocks: [`store Configuration {
apiKey String?
rootFolder String?
updatedAt Date @default(now()) @updatedAt
}`],
        });
    });
});