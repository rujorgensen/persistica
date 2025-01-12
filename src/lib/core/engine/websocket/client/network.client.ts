import { BehaviorSubject, filter, type Observable } from 'rxjs';
import type { NetworkClient } from '../../network/abstract-network.client';
import type { NetworkHostInterface } from '../../network/network-client-interface.class';
import type { INetworkState } from '../../network/network.interfaces';
import type { PersisticaWebsocketClient } from '../websocket.client';
import type { TDataType } from '../../synchronizer/synchronizer-state-detector.fn';
import type { TUniqueIdentifier } from '../../_types/element.type';

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

    constructor(
        private readonly _wsClient: PersisticaWebsocketClient,
    ) {
        this.databaseHash$$ = this._databaseHash$$
            .pipe(
                filterNil(),
            );

        this._wsClient
            .onRemoteDatabaseHash((
                remoteDataBaseHash: string,
            ) => {
                this._databaseHash$$.next(remoteDataBaseHash);
            });

        this.readDatabaseHash()
            .then((hash: string) => {
                this._databaseHash$$.next(hash);
            });
    }

    // * Live updates on the opposite side
    public onCreate = this._wsClient.onCreate.bind(this._wsClient);
    public onUpdate = this._wsClient.onUpdate.bind(this._wsClient);
    public onDelete = this._wsClient.onDelete.bind(this._wsClient);

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

    public joinNetwork(
        networkState: INetworkState,
    ): Promise<INetworkState> {
        return this._wsCLient.callRemoteProcedure(
            'joinNetwork',
            networkState,
        );
    }

    public getPeerInterface(
    ): NetworkHostInterface {
        return new NetworkHostWebsocketInterface(this._wsCLient);
    }
}
