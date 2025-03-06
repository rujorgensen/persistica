import { expect, describe, it } from 'vitest';
import { validateModel } from './validate-model.js';

describe('validateModel', () => {

    it('should throw an error', () => {
        expect(() => validateModel(`model YtbVideo {
    id String @id
    videoId                 String @unique
}`),
        ).toThrow('@id must be the only annotation.');
    });

    it('should not throw an error', () => {
        expect(() => validateModel(`model YtbVideo {
    id @id
    videoId                 String @unique
}`),
        ).not.toThrow();
    });
});
