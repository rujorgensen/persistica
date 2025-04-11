import type { Observable } from 'rxjs';
import type { TDataType } from '../synchronizer/synchronizer-state-detector.fn.ts';
import type { TUniqueIdentifier } from '../_types/element.type.ts';
import type { TSynchronizerState } from '../synchronizer/synchronizer.ts';
import type { TClientId } from './network.interfaces.ts';

/**
 * The interface that the server will use to register RPC functions
 */
export interface IRegisterFunctions {
    readBatchAt<T>(
        tableName: string,
        index: number,
        batchSize: number,
    ): Promise<ReadonlyArray<TDataType<T>>>;

    readElementAt<T>(
        tableName: string,
        index: number,
    ): Promise<TDataType<T> | undefined>;

    create<T, TableName extends string>(
        tableName: TableName,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>,

    update<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>,

    delete(
        tableName: string,
        data: TUniqueIdentifier[],
    ): Promise<void>,

    readDatabaseHash(

    ): Promise<string>,

    readRowCount(
        tableName: string,
    ): Promise<number>;

    readTableHash(
        tableName: string,
    ): Promise<string | undefined>;

    readTableRowHash(
        tableName: string,
        rowIndex: number,
    ): Promise<string | undefined>;

    emitSynchronizationState(
        state: TSynchronizerState,
    ): Promise<void>;
}

/**
 * The interface to the network host
 */
export abstract class NetworkHostInterface implements IRegisterFunctions {

    public abstract readonly clientId: TClientId;
    public abstract readonly databaseHash$$: Observable<string>;

    /**
     * Events happening on the opposite side
     */
    public abstract readonly onCreate: <T>(fn: (tableName: string, v: ReadonlyArray<TDataType<T>>) => void) => void;
    public abstract readonly onUpdate: <T>(fn: (tableName: string, v: ReadonlyArray<TDataType<T>>) => void) => void;
    public abstract readonly onDelete: <T>(fn: (tableName: string, v: ReadonlyArray<TDataType<T>>) => void) => void;

    public abstract readBatchAt<T>(
        tableName: string,
        index: number,
        batchSize: number,
    ): Promise<ReadonlyArray<TDataType<T>>>;

    public abstract readElementAt: <T>(
        tableName: string,
        index: number,
    ) => Promise<TDataType<T> | undefined>;

    /**
     * Update when changes happens
     */
    public abstract create<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>;

    public abstract update<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>;

    public abstract delete<T>(
        tableName: string,
        data: TUniqueIdentifier[] | ReadonlyArray<TDataType<T>>,
    ): Promise<void>;

    public abstract readDatabaseHash: () => Promise<string>;

    /**
     * Gets the number of rows in the table
     * 
     * @param { string } tableName
     * 
     * @returns { Promise<number> }
     */
    public abstract readRowCount(
        tableName: string,
    ): Promise<number>;

    /**
     * 
     * @param { string } tableName
     * 
     * @returns { Promise<string | undefined> }
     */
    public abstract readTableHash(
        tableName: string,
    ): Promise<string | undefined>;

    /**
     * 
     * @param { string } tableName
     * @param { number } rowIndex
     * 
     * @returns { Promise<string | undefined> }
     */
    public abstract readTableRowHash(
        tableName: string,
        rowIndex: number,
    ): Promise<string | undefined>;

    /**
     * Notify the host, of the current sync state.
     * 
     * @param state 
     */
    public abstract emitSynchronizationState(
        state: TSynchronizerState,
    ): Promise<void>;

}
