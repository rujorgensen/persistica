import { toLowerCamelCase } from './lower-camel-case';

describe('toLowerCamelCase', () => {
    it('should convert to lower camel case', () => {
        expect(toLowerCamelCase('YtbVideo')).toBe('ytbVideo');
        expect(toLowerCamelCase('VideoDownloadState')).toBe('videoDownloadState');
        expect(toLowerCamelCase('Configuration')).toBe('configuration');
        expect(toLowerCamelCase('COonfFguration')).toBe('cOonfFguration');
        expect(toLowerCamelCase('-COonfFguration')).toBe('cOonfFguration');
    });
});