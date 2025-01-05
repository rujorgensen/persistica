import { sanitizeString } from '../_utils/sanitize-string';

export const validModelMock: string = sanitizeString(`model YtbChannel {
    id                                              @id
    channelId               String                  @unique
    channelDescription      String
    createdAt               Date                    @default(now())
}`);

export const validSchemaMock: string = sanitizeString(`generator client {
    output   = "/home/rj/posium/libs/packages/persistica/src/lib"
}

datasource db {
    provider = "sqlite"
    url      = env("file:biograf.db")
}

store Configuration {
    apiKey                  String                  @unique
    rootFolder              String?
    updatedAt               Date                    @default(now())     @updatedAt
}

${validModelMock}

model YtbVideo {
    id                                              @id
    videoId                 String                  @unique
    channelDescription      String
    createdAt               Date                    @default(now())
    downloadState           VideoDownloadState      @default(WAITING)
    downloadPath            String
}

enum VideoDownloadState {
    WAITING
    DOWNLOADING
    DOWNLOADED
    ERROR
}
`);
