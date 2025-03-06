import { Subject } from 'rxjs';
import type {
    IChangeSource,
} from '../engine/change-event.util.js';

export interface IEmitter {
    onCreate<TableName extends string, ReturnType>(
        table: TableName,
        cb: (
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    onUpdate<TableName extends string, ReturnType>(
        table: TableName,
        cb: (
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    onDelete<TableName extends string, ReturnType>(
        table: TableName,
        cb: (
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;
}

export const convertFromCallbackToEventSource = <ReturnType>(
    modelName: string,
    store: IEmitter,
): IChangeSource<ReturnType> => {
    const onCreate$$: Subject<ReadonlyArray<ReturnType>> = new Subject();
    const onUpdate$$: Subject<ReadonlyArray<ReturnType>> = new Subject();
    const onDelete$$: Subject<ReadonlyArray<ReturnType>> = new Subject();

    const eventSource: IChangeSource<ReturnType> = {
        onCreate$$: onCreate$$.asObservable(),
        onUpdate$$: onUpdate$$.asObservable(),
        onDelete$$: onDelete$$.asObservable(),
    };

    store.onCreate(modelName, onCreate$$.next.bind(onCreate$$));
    store.onUpdate(modelName, onUpdate$$.next.bind(onUpdate$$));
    store.onDelete(modelName, onDelete$$.next.bind(onDelete$$));

    return eventSource;
}