import { IParsedModelBlock, parseModelBlock } from '../../_parsers/models/parse-model-block';
import { TModelBlock } from '../../schema/split-schema';

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

// export interface IParsedModelBlock {
//     modelName: string;
//     properties: IModelProperty[];
// }

// export const parseModelBlock = (
//     modelBlock: TModelBlock,
// ): IParsedModelBlock => {
//     return {
//         modelName: toLowerCamelCase(captureModelName(modelBlock)),
//         properties: parseProperties(modelBlock),
//     };
// };