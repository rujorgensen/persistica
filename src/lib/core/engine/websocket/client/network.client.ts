import { BehaviorSubject, filter, type Observable } from 'rxjs';
import type { NetworkClient } from '../../network/abstract-network.client';
import type { NetworkHostInterface } from '../../network/network-host-interface.class';
import type { INetworkState } from '../../network/network.interfaces';
import type { PersisticaWebsocketClient } from '../websocket.client';
import type { TDataType } from '../../synchronizer/synchronizer-state-detector.fn';
import type { TUniqueIdentifier } from '../../_types/element.type';
import type { TSynchronizerState } from '../../synchronizer/synchronizer';

/**
 * Filters off NULL and undefined, and provides type safety of type T.
 *
 * @returns { (source$: Observable<null | undefined | T>) => Observable<T> }
 */
export function filterNil<T>() {
    return (source$: Observable<null | undefined | T>): Observable<T> =>
        source$.pipe(
            filter((input: null | undefined | T): input is T =>
                (input !== null) && (input !== undefined),
            ),
        );
}

class NetworkHostWebsocketInterface implements NetworkHostInterface {
    private readonly _databaseHash$$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
    public readonly databaseHash$$: Observable<string>;

    // * Live updates on the opposite side
    public readonly onCreate;
    public readonly onUpdate;
    public readonly onDelete;

    constructor(
        //  public readonly tableDeletes: ReadonlyArray<Readonly<ITableDeletes>>,
        private readonly _wsClient: PersisticaWebsocketClient,
    ) {
        this.databaseHash$$ = this._databaseHash$$
            .pipe(
                filterNil(),
            );

        this._wsClient
            .onRemoteDatabaseHash(this._databaseHash$$.next.bind(this._databaseHash$$));

        this.readDatabaseHash()
            .then(this._databaseHash$$.next.bind(this._databaseHash$$));

        // * Live updates on the opposite side
        this.onCreate = this._wsClient.onCreate.bind(this._wsClient);
        this.onUpdate = this._wsClient.onUpdate.bind(this._wsClient);
        this.onDelete = this._wsClient.onDelete.bind(this._wsClient);
    }

    // * Update on the opposite side
    public create<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void> {
        return this._wsClient.callRemoteProcedure(
            'create',
            tableName,
            data,
        );
    }

    public update<T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void> {
        return this._wsClient.callRemoteProcedure(
            'update',
            tableName,
            data,
        );
    }

    public delete(
        tableName: string,
        data: TUniqueIdentifier[],
    ): Promise<void> {
        return this._wsClient.callRemoteProcedure(
            'delete',
            tableName,
            data,
        );
    }

    // * Used for synchronization
    public readBatchAt<T>(
        tableName: string,
        index: number,
        batchSize: number,
    ): Promise<TDataType<T>[]> {
        return this._wsClient.callRemoteProcedure(
            'readBatchAt',
            tableName,
            index,
            batchSize,
        );
    }

    public readElementAt<T>(
        tableName: string,
        index: number,
    ): Promise<TDataType<T> | undefined> {
        return this._wsClient.callRemoteProcedure(
            'readElementAt',
            tableName,
            index,
        );
    }

    public readDatabaseHash(
    ): Promise<string> {
        return this._wsClient.callRemoteProcedure(
            'readDatabaseHash',
        );
    }

    public readRowCount(
        tableName: string,
    ): Promise<number> {
        return this._wsClient.callRemoteProcedure(
            'readRowCount',
            tableName,
        );
    }

    public readTableHash(
        tableName: string,
    ): Promise<string | undefined> {
        return this._wsClient.callRemoteProcedure(
            'readTableHash',
            tableName,
        );
    }

    public readTableRowHash(
        tableName: string,
        rowIndex: number,
    ): Promise<string | undefined> {
        return this._wsClient.callRemoteProcedure(
            'readTableRowHash',
            tableName,
            rowIndex,
        );
    }

    public emitSynchronizationState(
        state: TSynchronizerState,
    ): Promise<void> {
        return this._wsClient.callRemoteProcedure(
            'emitSynchronizationState',
            state,
        );
    }
}

export class NetworkWebsocketClient implements NetworkClient {

    constructor(
        private readonly _wsCLient: PersisticaWebsocketClient,
    ) { }

    /**
     * Attempt to connect to the server.
     * 
     * @returns { Promise<void> }
     */
    public connect(

    ): Promise<void> {
        return this._wsCLient.connect();
    }

    /**
     * Disconnect from the server.
     * 
     * @returns { Promise<void> }
     */
    public disconnect(

    ): Promise<void> {
        return this._wsCLient.disconnect();
    }

    /**
     * 
     * @param networkState
     * 
     * @returns { Promise<INetworkState> }
     */
    public joinNetwork(
        networkState: INetworkState,
    ): Promise<INetworkState> {
        return this._wsCLient.callRemoteProcedure(
            'joinNetwork',
            networkState,
        );
    }

    /**
     * 
     * @returns { NetworkHostInterface }
     */
    public getPeerInterface(
        // tableDeletes: ReadonlyArray<Readonly<ITableDeletes>>,
    ): NetworkHostInterface {
        return new NetworkHostWebsocketInterface(
            //  tableDeletes,
            this._wsCLient,
        );
    }
}
