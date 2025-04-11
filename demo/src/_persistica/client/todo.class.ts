import type {
    ITodo,
} from '../todo.primitives';
import {
    type TDateAsString,
    type INetworkState,
    type PersistenceWrapper,
    LocalClient,
    BaseModel,
} from '@persistica/core';

const instantiate = (
    db: IDBDatabase,
): void => {
    if (!db.objectStoreNames.contains('TodoModel')) {
        const dataFrameStore = db.createObjectStore('TodoModel', { keyPath: '_idx', autoIncrement: true });
        dataFrameStore.createIndex('_idx', '_idx', { unique: true });

        dataFrameStore.createIndex('id', 'id', { unique: true });
        dataFrameStore.createIndex('description', 'description', { unique: false });
        dataFrameStore.createIndex('isCompleted', 'isCompleted', { unique: false });
        dataFrameStore.createIndex('priority', 'priority', { unique: false });
        dataFrameStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        dataFrameStore.createIndex('createdAt', 'createdAt', { unique: false });
    }
};

export class TodoModel extends BaseModel<'TodoModel', ITodo> {

    constructor(
        private readonly _store: PersistenceWrapper,
    ) {
        super(
            'id',
            'TodoModel',
            _store,
        );
    }
}

/** 
 * Parse the data from the database 
 */
export const parser = (
    value: TDateAsString<ITodo>,
): ITodo => {

    return {
        ...value,
        // Instantiate dates
        updatedAt: value.updatedAt ? new Date(value.updatedAt) : undefined,
        createdAt: new Date(value.createdAt),
    };
};

type TTableTypeMap = {
    TodoModel: ITodo;
};

export class TodoApplication extends LocalClient<TTableTypeMap, 'TodoModel'> {

    // * Models
    public readonly todoModel: TodoModel;

    constructor(
        private readonly networkState_: INetworkState,
        configuration?: {
            webSocketPort: number; // Default 3000: The port for reaching Persistica for global persistence
        },
    ) {
        super(
            {
                webSocketPort: configuration?.webSocketPort ?? 3_000,
            },
            networkState_,
            [
                instantiate,
            ],
            {
                TodoModel: parser,
            },
            // Return unique identiier
            {
                TodoModel: {
                    resolve: (
                        _element: unknown,
                    ) => {
                        return 'id';
                    },
                    indexName: 'id',
                },
            },
        );

        this.todoModel = new TodoModel(this.store);
    }
}