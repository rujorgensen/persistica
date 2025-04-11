import type { TAnyCallback, TCallback, TGenericTableName } from '../_types/element.type.ts';

export class ListenerHandler {
    private readonly createListeners: Map<TGenericTableName, Set<TCallback<any>>> = new Map();
    private readonly updateListeners: Map<TGenericTableName, Set<TCallback<any>>> = new Map();
    private readonly deleteListeners: Map<TGenericTableName, Set<TCallback<any>>> = new Map();
    private readonly anyCreateListeners: Set<TAnyCallback<any>> = new Set();
    private readonly anyUpdateListeners: Set<TAnyCallback<any>> = new Set();
    private readonly anyDeleteListeners: Set<TAnyCallback<any>> = new Set();

    private readonly databaseReadyListeners: Set<() => void> = new Set();
    private readonly databaseUpgradedAndReadyListeners: Set<() => void> = new Set();

    // ******************************************************************************
    // *** Subscribe to events
    // ******************************************************************************
    public onCreate<ReturnType2>(
        tableName: TGenericTableName,
        cb: TCallback<ReturnType2>,
    ): void {
        const tableListeners: Set<TCallback<ReturnType2>> | undefined = this.createListeners.get(tableName);

        if (tableListeners === undefined) {
            this.createListeners.set(tableName, new Set([cb]));
            return;
        }

        tableListeners.add(cb);
    }

    public onUpdate<ReturnType2>(
        tableName: TGenericTableName,
        cb: TCallback<ReturnType2>,
    ): void {
        const tableListeners: Set<TCallback<ReturnType2>> | undefined = this.updateListeners.get(tableName);

        if (tableListeners === undefined) {
            this.updateListeners.set(tableName, new Set([cb]));
            return;
        }

        tableListeners.add(cb);
    }

    public onDelete<ReturnType2>(
        tableName: TGenericTableName,
        cb: TCallback<ReturnType2>,
    ): void {
        const tableListeners: Set<TCallback<ReturnType2>> | undefined = this.deleteListeners.get(tableName);

        if (tableListeners === undefined) {
            this.deleteListeners.set(tableName, new Set([cb]));
            return;
        }

        tableListeners.add(cb);
    }

    public onAnyCreate<ReturnType2>(
        cb: TAnyCallback<ReturnType2>,
    ): void {
        this.anyCreateListeners.add(cb);
    }

    public onAnyUpdate<ReturnType2>(
        cb: TAnyCallback<ReturnType2>,
    ): void {
        this.anyUpdateListeners.add(cb);
    }

    public onAnyDelete<ReturnType2>(
        cb: TAnyCallback<ReturnType2>,
    ): void {
        this.anyDeleteListeners.add(cb);
    }

    public onDatabaseReady(
        cb: () => void,
    ): void {
        this.databaseReadyListeners.add(cb);
    }

    public onDatabaseUpgradedAndReady(
        cb: () => void,
    ): void {
        this.databaseUpgradedAndReadyListeners.add(cb);
    }

    // ******************************************************************************
    // *** Emit events
    // ******************************************************************************
    public emitCreated<ReturnType2>(
        tableName: TGenericTableName,
        created: ReadonlyArray<ReturnType2>,
        internalOnly?: boolean,
    ): void {
        const tableListeners: Set<TCallback<ReturnType2>> | undefined = this.createListeners.get(tableName);

        if (tableListeners) {
            for (const listener of tableListeners) {
                listener(created, internalOnly);
            }
        }

        for (const listener of this.anyCreateListeners) {
            listener(tableName, created);
        }
    }

    public emitUpdated<ReturnType2>(
        tableName: TGenericTableName,
        updated: ReadonlyArray<ReturnType2>,
        internalOnly?: boolean,
    ): void {
        const tableListeners: Set<TCallback<ReturnType2>> | undefined = this.updateListeners.get(tableName);

        if (tableListeners) {
            for (const listener of tableListeners) {
                listener(updated, internalOnly);
            }
        }

        for (const listener of this.anyUpdateListeners) {
            listener(tableName, updated);
        }
    }

    public emitDeleted<ReturnType2>(
        tableName: TGenericTableName,
        deleted: ReadonlyArray<ReturnType2>,
        internalOnly?: boolean,
    ): void {
        const tableListeners: Set<TCallback<ReturnType2>> | undefined = this.deleteListeners.get(tableName);

        if (tableListeners) {
            for (const listener of tableListeners) {
                listener(deleted, internalOnly);
            }
        }

        for (const listener of this.anyDeleteListeners) {
            listener(tableName, deleted);
        }
    }

    public emitDatabaseReady(
    ): void {
        for (const listener of this.databaseReadyListeners) {
            listener();
        }

        this.databaseReadyListeners.clear();
    }

    public emitDatabaseUpgradedAndReady(
    ): void {
        for (const listener of this.databaseUpgradedAndReadyListeners) {
            listener();
        }

        this.databaseUpgradedAndReadyListeners.clear();
    }
}