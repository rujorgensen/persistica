/**
 * Network server
 * 
 * Loose definition. Is used by the PersisticaNetwork class
 */
import { firstValueFrom } from 'rxjs';
import type { TTableDefinition, TUniqueIdentifier } from '../../_types/element.type.ts';
import type { NetworkServer } from '../../network/abstract-network.server.ts';
import type { IRegisterFunctions } from '../../network/network-host-interface.class.ts';
import type { INetworkState, TNetworkId } from '../../network/network.interfaces.ts';
import { MemoryStore } from '../../stores/memory/memory.store.js';
import type { TDataType } from '../../synchronizer/synchronizer-state-detector.fn.ts';
import type { TSynchronizerState } from '../../synchronizer/synchronizer.ts';
import type { RPCServer } from '../rpc/rpc-server.class.ts';
import { TDateAsString } from 'src/lib/core/data-types/filter.interfaces.js';

export class NetworkWebsocketServer<T extends keyof IRegisterFunctions> implements NetworkServer {

    constructor(
        private readonly _rpcServer: RPCServer<T | 'joinNetwork' | 'emitSynchronizationState'>,
        private readonly _registerFunctions: IRegisterFunctions,
    ) {
        // Register functions
        const functions = Object.entries(this._registerFunctions);
        console.log(`[NW Server] Registering ${Object.keys(this._registerFunctions).length} RPC functions`);
        for (const [key, value] of functions) {
            //  console.log(`Registering RPC function: "${key}"`);
            this._rpcServer
                .registerMethod(
                    key as T | 'joinNetwork' | 'emitSynchronizationState',
                    value,
                );
        }
    }

    /**
     * 
     * @param fn
     * 
     * @returns { void }
     */
    public onIncommingConnectionRequest(
        fn: (
            peerNetworkState: INetworkState,
        ) => INetworkState,
    ): void {
        this._rpcServer.registerMethod(
            'joinNetwork',  // RPC method name
            (
                peerNetworkState: INetworkState,
            ): INetworkState => {
                return fn(
                    peerNetworkState,
                );
            },
        );
    }

    /**
     * 
     * @param fn
     * 
     * @returns { void }
     */
    public onEmitSynchronizationState(
        fn: (
            state: TSynchronizerState,
        ) => void,
    ): void {
        this._rpcServer.registerMethod(
            'emitSynchronizationState',  // RPC method name
            (
                state: TSynchronizerState,
            ): void => {
                fn(
                    state,
                );
            },
        );
    }
}

type TTableTypeMap = {
    TodoModel: TTableDefinition;
};

/**
 * ! MOVE TO DEMO, THIS IS THE GENERATED OUTPUT
 */
export class TodoPersisticaNetwork<TableTypeMap> extends NetworkWebsocketServer<keyof IRegisterFunctions> {
    private readonly memoryStore: MemoryStore<TTableTypeMap, 'TodoModel'> = new MemoryStore<TTableTypeMap, 'TodoModel'>({
        TodoModel: {
            idkn: 'id',
        },
    });

    constructor(
        private readonly networkId: TNetworkId,
        // private readonly networkKey: string,
        private readonly rpcServer: RPCServer<keyof IRegisterFunctions | 'joinNetwork' | 'emitSynchronizationState'>,
    ) {
        super(
            rpcServer,
            {
                readBatchAt: <T>(
                    tableName: string,
                    index: number,
                    batchSize: number,
                ): Promise<ReadonlyArray<TDataType<T>>> => {
                    console.log('readBatchAt method not implemented.', { tableName, index, batchSize });

                    throw new Error('readBatchAt method not implemented.');
                },


                readElementAt: <T>(
                    tableName: string,
                    index: number,
                ): Promise<TDataType<T> | undefined> => {
                    console.log('readElementAt method not implemented.', { tableName, index });

                    throw new Error('readElementAt method not implemented.');
                },


                create: async <T>(
                    tableName: string,
                    data: ReadonlyArray<T>,
                ): Promise<void> => {
                    console.log(`Inserting ${data.length} element(s) into table "${tableName}" from network client`);

                    await this.memoryStore.create(tableName as any, data, true);
                },

                update: async<T>(
                    tableName: string,
                    data: ReadonlyArray<TDataType<T>>,
                ): Promise<void> => {
                    console.log(`Updating ${data.length} element(s) in table "${tableName}" from network client`);

                    await this.memoryStore.update(tableName as any, data, true);
                },

                delete: async (
                    tableName: string,
                    data: TUniqueIdentifier[],
                ): Promise<void> => {
                    console.log(`Deleting ${data.length} element(s) in table "${tableName}" from network client`);

                    await this.memoryStore.delete(tableName as any, data, true);
                },


                readDatabaseHash: (

                ): Promise<string> => {
                    return firstValueFrom(this.memoryStore.hash$$);
                },
                // readDatabaseHash: (
                // ): Promise<string> => firstValueFrom(this.store.hash$$),

                readRowCount: (
                    tableName: string,
                ): Promise<number> => {
                    return Promise.resolve(this.memoryStore.readRowCount(tableName));
                },

                readTableHash: (
                    tableName: string,
                ): Promise<string | undefined> => {
                    return Promise.resolve(this.memoryStore.readTableHash(tableName));
                },

                readTableRowHash: (
                    tableName: string,
                    rowIndex: number,
                ): Promise<string | undefined> => {
                    return Promise.resolve(this.memoryStore.readTableRowHash(tableName, rowIndex));
                },

                /**
                 * On client connection state
                 * @param state 
                 */
                emitSynchronizationState: (
                    state: TSynchronizerState,
                ): Promise<void> => {
                    console.log('emitSynchronizationState method not implemented: ' + state);

                    return Promise.resolve();
                    // throw new Error('emitSynchronizationState method not implemented.' + state);
                },

            },
        );

        this.onIncommingConnectionRequest((
            peerNetworkState: INetworkState,
        ): INetworkState => {
            return {
                networkId: this.networkId,
                // networkKey?: string; // Only keep locally, remove when transferring
                clientId: 'ci-dasdaskdaslækdasdæaslk',
                version: this.memoryStore.version,
                knownPeers: [],
                tableDeletes: [],
            };
        });
    }
}
