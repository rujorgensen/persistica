import { expect, describe, it } from 'vitest';

import { generateClassMethod } from "./generate-class-method";
import { validModelMock } from 'src/lib/core/_mocks/schema.mocks';

describe('generateClassMethod', () => {
    it('should generate class method', () => {
        expect(generateClassMethod(validModelMock)).toBe('public ytbChannel(\n    ): void {\n    }');
    });
});