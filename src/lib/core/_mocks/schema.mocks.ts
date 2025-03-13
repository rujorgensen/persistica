import { sanitizeString } from '../_utils/sanitize-string.js';

export const validStoreMock: string = sanitizeString(`store Configuration {
    apiKey                  String?
    rootFolder              String?
    updatedAt               Date                @default(now())     @updatedAt
}`);

export const validModelMock: string = sanitizeString(`model YtbChannel {
    id                                              @id
    channelId               String                  @unique
    channelDescription      String
    createdAt               Date                    @default(now())
}`);

export const validModelMock2: string = sanitizeString(`model YtbVideo {
    id                                              @id
    videoId                 String                  @unique
    channelDescription      String
    watched                 Boolean                 @default(false)
    createdAt               Date                    @default(now())
    downloadState           VideoDownloadState      @default(WAITING)
    downloadPath            String
}`);

export const validSchemaMock: string = sanitizeString(`generator client {
    output   = "./persistica/src/lib"
}

datasource db {
    provider = "sqlite"
    url      = env("file:biograf.db")
}

${validStoreMock}

${validModelMock}

${validModelMock2}

enum VideoDownloadState {
    WAITING
    DOWNLOADING
    DOWNLOADED
    ERROR
}
`);
