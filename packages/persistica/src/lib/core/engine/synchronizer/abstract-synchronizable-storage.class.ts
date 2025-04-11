
import type { Observable } from 'rxjs';
import type { TLocalStoreState } from '../persistence.wrapper';
import type { TDataType } from './synchronizer-state-detector.fn';
import type { TUniqueIdentifier } from '../_types/element.type';

/**
 * A storage that can be synchronized with other storages
 */
export abstract class SynchronizableStorage {
    public abstract readonly hash$$: Observable<string>;
    public abstract readonly state$$: Observable<TLocalStoreState>;

    public abstract readonly onAnyCreate: (fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void) => void;
    public abstract readonly onAnyUpdate: (fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void) => void;
    public abstract readonly onAnyDelete: (fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void) => void;

    public abstract create<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>;

    public abstract update<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void>;

    public abstract delete(
        tableName: string,
        data: TUniqueIdentifier | TUniqueIdentifier[] | TDataType<any> | ReadonlyArray<TDataType<any>>,
    ): Promise<void>;

    public abstract rowIterator(
        tableName: string,
        value: (r: any) => void,
    ): Promise<void>;

    public abstract readTableNames(): ReadonlyArray<string>;

    public abstract readElementAt: <T>(
        tableName: string,
        index: number,
    ) => Promise<TDataType<T> | undefined>;

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
}