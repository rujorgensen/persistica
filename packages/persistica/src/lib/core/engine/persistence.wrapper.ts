import type { Observable } from 'rxjs';
import type { TUniqueIdentifier } from './_types/element.type.ts';
// import { EventEmitter } from 'node:events';
// import { fromEvent } from 'rxjs';
// export function fromEvent(target: NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter>, eventName: string): Observable<unknown>;

export type TLocalStoreState = 'idle' | 'upgrading' | 'migrating' | 'seeding' | 'hashing' | 'ready';
// import { EventEmitter } from 'events';

// class MyEmitter extends EventEmitter {}

// const emitter = new MyEmitter();

// emitter.on('event', (data) => {
//     console.log('Event received:', data);
// });

// emitter.emit('event', { message: 'Hello World' });

export abstract class PersistenceWrapper {// extends NodeStyleEventEmitter | ArrayLike<NodeStyleEventEmitter> {
    public readonly abstract state$$: Observable<TLocalStoreState>;
    public readonly abstract hash$$: Observable<string>;

    // ******************************************************************************
    // *** Database Events
    // ******************************************************************************
    public abstract onAnyCreate(
        cb: <TableName extends string, ReturnType>(
            table: TableName,
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    public abstract onAnyUpdate(
        cb: <TableName extends string, ReturnType>(
            table: TableName,
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    public abstract onAnyDelete(
        cb: <TableName extends string, ReturnType>(
            table: TableName,
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    // ******************************************************************************
    // *** Table Events
    // ******************************************************************************
    public abstract onCreate<TableName extends string, ReturnType>(
        table: TableName,
        cb: (
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    public abstract onUpdate<TableName extends string, ReturnType>(
        table: TableName,
        cb: (
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    public abstract onDelete<TableName extends string, ReturnType>(
        table: TableName,
        cb: (
            value: ReadonlyArray<ReturnType>,
        ) => void
    ): void;

    // ******************************************************************************
    // *** CRUD Operations
    // ******************************************************************************
    public abstract create<ReturnType>(
        tableName: string,
        o: ReturnType | ReadonlyArray<ReturnType>,
        internalOnly?: boolean,
    ): Promise<ReturnType | ReadonlyArray<ReturnType>>;

    public abstract read<ReturnType>(
        tableName: string,
        cuid: TUniqueIdentifier,
    ): Promise<ReturnType | undefined>;

    public abstract readMany<ReturnType>(
        tableName: string,
    ): Promise<ReadonlyArray<ReturnType>>;

    public abstract update<ReturnType>(
        tableName: string,
        o: ReturnType | ReadonlyArray<ReturnType>,
        internalOnly?: boolean,
    ): Promise<ReturnType | ReadonlyArray<ReturnType>>;

    public abstract delete<ReturnType>(
        tableName: string,
        o: TUniqueIdentifier | TUniqueIdentifier[],
        internalOnly?: boolean,
    ): Promise<ReturnType | undefined | ReadonlyArray<ReturnType>>;

    // ******************************************************************************
    // *** Database Events
    // ******************************************************************************
    /**
     * The database is instantiated. Eg. for seeding.
     * 
     * @param cb
     * 
     * @returns { void } 
     */
    public abstract onReady(
        cb: () => void
    ): void;

    /**
     * The database is upgraded and instantiated. Eg. for seeding.
     * 
     * Will only emit, if the database was just upgraded, and the onsuccess event was fired.
     * Fires after onReady()
     * 
     * @param cb
     * 
     * @returns { void } 
     */
    public abstract onUpgradedAndReady(
        cb: () => void
    ): void;

    /**
     * Implement EventEmitter
     */

    // private readonly events: Map<string | symbol, ((...args: any[]) => void)[]> = new Map();

    // public override on(
    //     eventName: string | symbol,
    //     listener: (...args: any[]) => void,
    // ) {
    //     if (!this.events.has(eventName)) {
    //         this.events.set(eventName, []);
    //     }
    //     // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //     this.events.get(eventName)!.push(listener);

    //     return this;
    // }

    // public override off(
    //     event: string,
    //     listener: (...args: any[]) => void,
    // ) {
    //     if (this.events.has(event)) {
    //         // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //         this.events.set(event, this.events.get(event)!.filter(l => l !== listener));
    //     }

    //     return this;
    // }

    // public override emit(
    //     event: string,
    //     ...args: any[]
    // ) {
    //     if (this.events.has(event)) {
    //         // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //         // biome-ignore lint/complexity/noForEach: <explanation>
    //         this.events.get(event)!.forEach(listener => listener(...args));
    //     }

    //     return false; // TODO
    // }

    // public override addListener(
    //     eventName: string | symbol,
    //     handler: NodeEventHandler,
    // ) {

    //     if (!this.events.has(eventName)) {
    //         this.events.set(eventName, []);
    //     }
    //     // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //     this.events.get(eventName)!.push(handler);

    //     return this;
    // }

    // public override removeListener(
    //     eventName: string | symbol,
    //     handler: NodeEventHandler,
    // ) {
    //     if (this.events.has(eventName)) {
    //         // biome-ignore lint/style/noNonNullAssertion: <explanation>
    //         this.events.set(eventName, this.events.get(eventName)!.filter(l => l !== handler));
    //     }

    //     return this;
    // }

}
