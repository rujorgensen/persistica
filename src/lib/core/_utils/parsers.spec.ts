import { expect, describe, it } from 'vitest';
import { validSchemaMock } from '../_mocks/schema.mocks';
import { captureOutput } from './parsers.utils';

describe('captureOutput', () => {

    describe('detect output value', () => {
        it('should capture the enum name', () => {
            expect(captureOutput(validSchemaMock),
            ).toBe(`/home/rj/posium/libs/packages/persistica/src/lib`);
        });
    });

});