import { type IParsedModelBlock, parseModelBlock } from 'src/lib/core/_parsers/models/parse-model-block.js';
import type { TModelBlock } from 'src/lib/core/schema/split-schema.js';


export const generateClassMethod = (
    modelBlock: TModelBlock,
): string => {
    const parsedModelBlock: IParsedModelBlock = parseModelBlock(modelBlock);

    return `public ${parsedModelBlock.modelName}(
    ): void {
    }`;
};

// export interface IModelProperty {
//     name: string;
//     type: TBaseType | 'UniqueId';
//     isOptional: boolean;
// }

// export const parseModelBlock = (
//     modelBlock: TModelBlock,
// ): IParsedModelBlock => {
//     return {
//         modelName: toLowerCamelCase(captureModelName(modelBlock)),
//         properties: parseProperties(modelBlock),
//     };
// };