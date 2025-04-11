import Alpine from 'alpinejs';
import { TodoApplication } from '../_persistica/client/todo.class.js';
import {
    type CurrentNetworkStore,
    Persistica,
} from '@persistica';
import type {
    INetworkState,
    TLocalStoreState,
    TSynchronizerState,
} from '@persistica/core';
import type { ITodo } from '../_persistica/todo.primitives.js';
import type { TConnectionState } from 'src/lib/core/engine/websocket/websocket.client.js';
import type { THandshakeState } from 'src/lib/core/engine/client/network/network.class.js';
import { TodoApplication2 } from '../_persistica/client/todotodo.class.js';

const persistica: Persistica = new Persistica();
const currentNetworkStore: CurrentNetworkStore = persistica.getNetworkStore('ni-ZFQ9QzK9oSHpCGRU70uF8');
const currentNetworkState: INetworkState = (await currentNetworkStore.read()) || persistica.createWorkspace('my-secret-key');

const todoApplication = new TodoApplication(
    currentNetworkState,
    {
        webSocketPort: 3_001,
    },
);


const todoApplication2 = new TodoApplication2('ni-uiodasdu8osa789');

todoApplication2
    .todoModel
    .read$$({
        // createdAt: {
        //     AFTER: new Date('2023-01-01'),
        // },
    })
    .subscribe({
        next: (todos: ITodo[]) => {
            console.log('Todos updated', todos);
        },
    });

todoApplication2
    .todoModel
    .create(
        {
            id: `${Math.floor(Math.random() * 10000)}`,
            title: 'Non-empty string',
            isCompleted: false,
            highPriority: false,
            updatedAt: new Date(),
            createdAt: new Date(),
        },
    );


// Define observable component
Alpine.data('todoApplication', () => ({
    websocketState: 'loading',
    storeState: <TLocalStoreState | 'loading'>'loading',
    networkState: <THandshakeState | 'loading'>'loading',
    synchronizerState: <TSynchronizerState | 'loading'>'loading',

    message: '',
    todos: <ITodo[]>[],
    init() {
        todoApplication.websocketState$$
            .subscribe({
                next: (websocketState: TConnectionState) => {
                    console.log('websocketState updated', websocketState);
                    this.websocketState = websocketState;
                },
            });

        todoApplication.storeState$$
            .subscribe({
                next: (storeState: TLocalStoreState) => {
                    console.log('storeState updated', storeState);
                    this.storeState = storeState;
                },
            });

        todoApplication.networkState$$
            .subscribe({
                next: (networkState: THandshakeState) => {
                    console.log('networkState updated', networkState);
                    this.networkState = networkState;
                },
            });

        todoApplication.synchronizerState$$
            .subscribe({
                next: (synchronizerState: TSynchronizerState) => {
                    console.log('synchronizerState updated', synchronizerState);
                    this.synchronizerState = synchronizerState;
                },
            });

        todoApplication.todoModel.read$$({

        })
            .subscribe({
                next: (todos: ITodo[]) => {
                    this.todos = todos;
                },
            });

        setTimeout(() => {
            todoApplication.joinNetwork();
        }, 500);
    },
    enter() {
        if (this.message.trim() !== "") {
            todoApplication.todoModel.create({
                id: Math.floor(Math.random() * 10000),
                description: this.message.trim(),
                isCompleted: false,
                priority: 'NORMAL',
                updatedAt: new Date(),
                createdAt: new Date(),
            })

            this.message = "";
        }
    },

    remove(
        todo_: ITodo,
    ) {
        todoApplication.todoModel.delete(todo_.id);
    },

    toggleState(
        todo_: ITodo,
    ) {
        todoApplication.todoModel.update({
            ...todo_,
            isCompleted: !todo_.isCompleted,
        })
    },
}));

console.log('⚙️ Starting alpine');
// Start Alpine.js
Alpine.start();