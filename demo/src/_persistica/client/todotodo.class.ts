
import {
    BaseModel,
    LocalClient2,
} from '@persistica/core';
import {
    DateTime,
    Id,
    Text,
    TrueOrFalse,
} from '../../../../src/lib/core/typed-db/type-helpers.fn.js';
import {
    DefineTable
} from '../../../../src/lib/core/typed-db/types.js';
import { generateInstantiator } from '../../../../src/lib/core/typed-db/indexeddb/generate-instantiator.fn.js';
import { generateParser } from '../../../../src/lib/core/typed-db/indexeddb/generate-parser.fn.js';
import { generateIdResolver } from '../../../../src/lib/core/typed-db/indexeddb/generate-id-resolver.fn.js';
import type {
    TNetworkId,
} from 'src/lib/core/engine/network/network.interfaces.js';

const TodoTable = DefineTable(
    'TodoModel',
    {
        id: Id(),

        title: Text
            .nonEmpty(),

        isCompleted: TrueOrFalse
            .optional(),

        highPriority: TrueOrFalse
            .optional()
            .default(false),

        updatedAt: DateTime
            .optional(),

        createdAt: DateTime
            .optional(),
    });

type ITodo = typeof TodoTable.Type;

type TTableTypeMap = {
    TodoModel: ITodo;
};

export class TodoApplication2 extends LocalClient2<TTableTypeMap> {

    // * Models
    public readonly todoModel: BaseModel<string, ITodo> = new BaseModel(
        generateIdResolver(TodoTable.fields).indexName,
        TodoTable.name,
        this.store,
    );

    constructor(
        private readonly _networkId: TNetworkId,
    ) {
        super(
            _networkId,
            [
                // Add instantiators
                generateInstantiator(TodoTable.name, TodoTable.fields),
            ],
            {
                // Parse the data from the database 
                TodoModel: generateParser(TodoTable.fields),
            },
            // Return unique identiier
            {
                TodoModel: generateIdResolver(TodoTable.fields),
            },
        );
    }
}
