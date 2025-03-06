import Alpine from 'alpinejs';
import { Todo } from '../_persistica/client/todo.class.js';
import {
    type CurrentNetworkStore,
    Persistica,
} from '@persistica';
import type {
    INetworkState,
} from '@persistica/core';
import type { ITodo } from '../_persistica/todo.primitives.js';

const persistica: Persistica = new Persistica();
const currentNetworkStore: CurrentNetworkStore = persistica.getNetworkStore('ni-ZFQ9QzK9oSHpCGRU70uF8');
const currentNetworkState: INetworkState = (await currentNetworkStore.read()) || persistica.createWorkspace('my-secret-key');

const todo = new Todo(currentNetworkState);

// Define observable component
Alpine.data('todoApplication', () => ({
    value: "Loading...",
    message: '',
    pTodos: [],
    todos: [],
    init() {
        console.log('🚀 Todo Application is live');

        todo.todoModel.read$$({})
            .subscribe({
                next: (todos: ITodo[]) => {
                    this.todos = <any>todos;
                },
            });
    },
    enter() {
        if (this.message.trim() !== "") {
            todo.todoModel.create({
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
        todo.todoModel.delete(todo_.id);
    },

    toggleState(
        todo: ITodo,
    ) {
        todo.isCompleted = !todo.isCompleted;
    },
}));

console.log('⚙️ Starting alpine');
// Start Alpine.js
Alpine.start();