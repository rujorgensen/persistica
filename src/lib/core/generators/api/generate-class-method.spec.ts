import { expect, describe, it } from 'vitest';
import { validModelMock } from "../../_mocks/schema.mocks";
import { generateClassMethod } from "./generate-class-method";

describe('generateClassMethod', () => {
    it('should generate class method', () => {
        expect(generateClassMethod(validModelMock)).toBe('public ytbChannel(\n    ): void {\n    }');
    });
});