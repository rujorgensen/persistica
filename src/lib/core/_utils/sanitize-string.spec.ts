import { expect, describe, it } from 'vitest';
import { validSchemaMock } from '../_mocks/schema.mocks';
import { sanitizeString } from './sanitize-string';

describe('sanitize-string', () => {
    it('should sanitize string #1', () => {
        expect(sanitizeString('test')).toBe('test');
    });

    it('should sanitize string #2', () => {
        expect(sanitizeString(validSchemaMock)).toBe(`generator client {
output = "./persistica/src/lib"
}
datasource db {
provider = "sqlite"
url = env("file:biograf.db")
}
store Configuration {
apiKey String?
rootFolder String?
updatedAt Date @default(now()) @updatedAt
}
model YtbChannel {
id @id
channelId String @unique
channelDescription String
createdAt Date @default(now())
}
model YtbVideo {
id @id
videoId String @unique
channelDescription String
watched Boolean @default(false)
createdAt Date @default(now())
downloadState VideoDownloadState @default(WAITING)
downloadPath String
}
enum VideoDownloadState {
WAITING
DOWNLOADING
DOWNLOADED
ERROR
}`);
    });
});