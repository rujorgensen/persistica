import Alpine from 'alpinejs';
import { interval, map } from 'rxjs';

console.log('🚀');

// Define observable component
Alpine.data('todoApplication', () => ({
    value: "Loading...",
    message: '',
    todos: [
        {
            msg: 'Default TODO',
            done: false,
        }
    ],
    init() {
        const observable = interval(1000).pipe(map(n => `Count: ${n}`));

        observable.subscribe(newValue => {
            console.log({ newValue });
            this.value = newValue;
        });
    },
    enter() {
        if (this.message.trim() !== "") {
            this.todos.push({
                msg: this.message.trim(),
                done: false,
            });
            this.message = "";
        }
    },
    remove(
        index: number,
    ) {
        this.todos.splice(index, 1);
    },
    toggleState(
        index: number,
    ) {
        this.todos[index].done = !this.todos[index].done;
    },
}));

// Start Alpine.js
Alpine.start();