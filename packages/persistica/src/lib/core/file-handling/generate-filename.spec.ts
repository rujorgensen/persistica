import { it, describe, expect } from 'vitest';
import { generateFileName } from './generate-filename';

describe('generate-filename', () => {
    it('should generate enum file name', () => {
        expect(generateFileName('VideoDownloadState', 'enum')).toBe('video-download-state.enum.ts');
    });

});