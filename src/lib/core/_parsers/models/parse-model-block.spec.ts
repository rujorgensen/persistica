import { expect, describe, it } from 'vitest';
import { validModelMock } from "../../_mocks/schema.mocks";
import { parseModelBlock } from "./parse-model-block";

describe('parseModelBlock', () => {
    it('should parse model block', () => {
        expect(parseModelBlock(validModelMock)).toStrictEqual({
            modelName: 'ytbChannel',
            properties: [
                {
                    name: 'id',
                    type: 'UniqueId',
                    isOptional: false,
                },
                {
                    name: 'channelId',
                    type: 'String',
                    isOptional: false,
                },
                {
                    name: 'channelDescription',
                    type: 'String',
                    isOptional: false,
                },
                {
                    name: 'createdAt',
                    type: 'Date',
                    isOptional: false,
                },
            ],
        });
    });
});