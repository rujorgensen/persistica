
import {
    type Observable,
    filter,
    BehaviorSubject,
    map,
} from 'rxjs';
import { ListenerHandler } from '../listeners.class';
import type { PersistenceWrapper, TLocalStoreState } from '../../persistence.wrapper';
import { hashAll } from '../_utils/db.class';
import { hashTables } from './hash.utils';
import type {
    TTableDefinition,
    TUniqueIdentifier,
    TDatabaseTableDefinition,
} from '../../_types/element.type.ts';

/**
 * Filters off NULL and undefined, and provides type safety of type T.
 *
 * @returns { (source$: Observable<null | undefined | T>) => Observable<T> }
 */
function filterNil<T>() {
    return (source$: Observable<null | undefined | T>): Observable<T> =>
        source$.pipe(
            filter((input: null | undefined | T): input is T =>
                (input !== null) && (input !== undefined),
            ),
        );
}

export class MemoryStore<TableTypeMap, TableName extends string & keyof TableTypeMap> implements PersistenceWrapper {

    public readonly version: number = 0;

    public readonly tableHash$$: BehaviorSubject<Map<TableName, string | undefined> | undefined>;
    public readonly hash$$: Observable<string>;

    public readonly state$$: Observable<TLocalStoreState>;
    private readonly state_: BehaviorSubject<TLocalStoreState> = new BehaviorSubject<TLocalStoreState>(
        'idle'
    );

    private readonly events: ListenerHandler = new ListenerHandler();

    private readonly map: Map<TableName, Map<TUniqueIdentifier, any>> = new Map();

    constructor(
        private readonly tables: TDatabaseTableDefinition<TableName>,
    ) {
        this.state$$ = this.state_.asObservable();

        // Initialize store
        for (const table of Object.keys(this.tables)) {
            this.map.set(table as TableName, new Map());
        }

        this.tableHash$$ = new BehaviorSubject<Map<TableName, string | undefined> | undefined>(hashTables(this.readAsSet()));
        this.hash$$ = this.tableHash$$
            .pipe(
                map(hashAll),
                filterNil(),
            );
    }

    public readRowCount(
        tableName: TableName,
    ): number {
        return this.map.get(tableName)?.size ?? 0;
    }

    public readTableHash(
        tableName: TableName,
    ): string | undefined {
        return this.tableHash$$.getValue()?.get(tableName);
    }

    public readTableRowHash(
        tableName: TableName,
        rowIndex: number,
    ): string | undefined {
        return [...(this.readAsSet().get(tableName) ?? [])][rowIndex].hash;
    }

    // ******************************************************************************
    // *** Implement Abstract Class
    // ******************************************************************************

    // ******************************************************************************
    // *** Database Events
    // ******************************************************************************
    public onCreate = this.events.onCreate.bind(this.events);
    public onUpdate = this.events.onUpdate.bind(this.events);
    public onDelete = this.events.onDelete.bind(this.events);
    public onAnyCreate = this.events.onAnyCreate.bind(this.events);
    public onAnyUpdate = this.events.onAnyUpdate.bind(this.events);
    public onAnyDelete = this.events.onAnyDelete.bind(this.events);
    public onReady = this.events.onDatabaseReady.bind(this.events);
    public onUpgradedAndReady = this.events.onDatabaseUpgradedAndReady.bind(this.events);

    // ******************************************************************************
    // *** CRUD Operations
    // ******************************************************************************
    public async create<ReturnType>(tableName: TableName, o: ReturnType, internalOnly?: boolean,): Promise<ReturnType>;
    public async create<ReturnType>(tableName: TableName, o: ReadonlyArray<ReturnType>, internalOnly?: boolean,): Promise<ReadonlyArray<ReturnType>>;
    public async create<ReturnType>(
        tableName: TableName,
        o: ReturnType | ReadonlyArray<ReturnType>,
        internalOnly?: boolean,
    ): Promise<ReturnType | ReadonlyArray<ReturnType>> {
        const tableData: Set<ReturnType> | undefined = this.readAsSet().get(tableName);

        if (tableData === undefined) {
            throw new Error(`Table "${tableName}" does not exist`);
        }

        if (Array.isArray(o)) {

            for (const a of o) {
                tableData.add(a);
            }

            this.tableHash$$.next(hashTables(this.readAsSet()));

            this.events.emitCreated(tableName, o, internalOnly);

            return Promise.resolve(o);
        }

        const ee: ReturnType = {
            ...o,
            // _cuid: e._cuid ?? `cu-${nanoid()}`,
        } as any;

        tableData.add(ee);

        this.tableHash$$.next(hashTables(this.readAsSet()));
        this.events.emitCreated(tableName, [ee], internalOnly);

        return Promise.resolve(ee);
    }

    /**
     * 
     * @param tableName
     * @param cuid
     * 
     * @returns 
     */
    public read<TableName_ extends string & TableName, ReturnType>(
        tableName: TableName_,
        cuid: TUniqueIdentifier,
    ): Promise<ReturnType | undefined> {
        const tableData: Set<ReturnType> | undefined = this.readAsSet().get(tableName);

        if (tableData === undefined) {
            throw new Error(`Table "${tableName}" does not exist`);
        }
        const keyName: TTableDefinition = this.tables[tableName] as TTableDefinition; // TODO FIX TYPE

        for (const existingData of tableData) {
            if (cuid === existingData[keyName.idkn as unknown as keyof ReturnType]) {
                return Promise.resolve(existingData);
            }
        }

        return Promise.resolve(undefined);
    }

    public async readMany<TableName_ extends string & TableName, ReturnType>(
        tableName: TableName_,
    ): Promise<ReadonlyArray<ReturnType>> {

        const tableData: Set<ReturnType> | undefined = this.readAsSet().get(tableName);

        if (tableData === undefined) {
            throw new Error(`Table "${tableName}" does not exist`);
        }

        return Promise.resolve([...tableData]);
    }

    /**
     * 
     * @param { TableName }                                             tableName
     * @param { TableTypeMap[TableName] | ReadonlyArray<ReturnType> }   updated
     * 
     * @returns { Promise<ReturnType | ReadonlyArray<ReturnType>> }
     */
    public async update<ReturnType>(tableName: TableName, key: ReturnType, internalOnly?: boolean,): Promise<ReturnType>;
    public async update<ReturnType>(tableName: TableName, key: ReadonlyArray<ReturnType>, internalOnly?: boolean,): Promise<ReadonlyArray<ReturnType>>;
    public async update<ReturnType>(
        tableName: TableName,
        updated: ReturnType | ReadonlyArray<ReturnType>,
        internalOnly?: boolean,
    ): Promise<ReturnType | ReadonlyArray<ReturnType>> {
        const tableData: Map<TUniqueIdentifier, TableTypeMap[TableName]> | undefined = this.map.get(tableName);

        if ((tableName === undefined) || (tableData === undefined)) {
            throw new Error(`Table "${tableName}" does not exist`);
        }

        const tableDefinition: TTableDefinition = this.tables[tableName] as TTableDefinition; // TODO FIX TYPE

        if (Array.isArray(updated)) {
            for (const dataToUpdate of updated) {
                const existingElement: TableTypeMap[TableName] | undefined = tableData.get(dataToUpdate._cuid);


                if (existingElement) {
                    tableData.set(dataToUpdate[tableDefinition.idkn as unknown as keyof ReturnType], {
                        ...existingElement,
                        ...dataToUpdate,
                    });
                }
            }
        } else {
            const uniqueId: TUniqueIdentifier = (updated as ReturnType)[tableDefinition.idkn as unknown as keyof ReturnType] as TUniqueIdentifier;

            const existingElement: TableTypeMap[TableName] | undefined = tableData.get(uniqueId);

            if (existingElement) {
                tableData.set(
                    uniqueId,
                    {
                        ...existingElement,
                        ...(updated as TableTypeMap[TableName]),
                    },
                );
            }
        }

        return Promise.resolve(updated);
    }

    public delete(tableName: TableName, key: TUniqueIdentifier, internalOnly?: boolean): Promise<TableTypeMap[TableName]>;
    public delete(tableName: TableName, key: TUniqueIdentifier[], internalOnly?: boolean): Promise<ReadonlyArray<TableTypeMap[TableName]>>;
    public delete(
        tableName: TableName,
        o: TUniqueIdentifier | TUniqueIdentifier[],
        internalOnly?: boolean,
    ): Promise<TableTypeMap[TableName] | undefined | ReadonlyArray<TableTypeMap[TableName]>> {
        const tableData: Map<TUniqueIdentifier, TableTypeMap[TableName]> | undefined = this.map.get(tableName);

        if (tableData === undefined) {
            throw new Error(`Table "${tableName}" does not exist`);
        }

        const toReturn: TableTypeMap[TableName][] = [];
        if (Array.isArray(o)) {
            for (const cuidToRemove of o) {
                const existingElement: TableTypeMap[TableName] | undefined = tableData.get(cuidToRemove);

                if (existingElement) {
                    tableData.delete(cuidToRemove);
                    toReturn.push(existingElement);
                }
            }

            this.events.emitDeleted(tableName, toReturn, internalOnly);

            return Promise.resolve(toReturn);
        }

        const existingData: TableTypeMap[TableName] | undefined = tableData.get(o);

        if (existingData) {
            tableData.delete(o);

            this.events.emitDeleted(tableName, [existingData], internalOnly);

            return Promise.resolve(existingData);
        }

        return Promise.resolve(undefined);
    }

    private readAsSet(
    ): Map<TableName, Set<any>> {
        const aa: Map<TableName, Set<any>> = new Map();

        for (const [key, elements] of this.map.entries()) {
            aa.set(key, new Set(elements.values()));
        }

        return aa;
    }
}