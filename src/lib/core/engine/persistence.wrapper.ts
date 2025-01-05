import type { Observable } from 'rxjs';
import type { TUniqueIdentifier } from './_types/element.type';

export type TLocalStoreState = 'idle' | 'upgrading' | 'migrating' | 'seeding' | 'hashing' | 'ready';

export abstract class PersistenceWrapper {
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
}
