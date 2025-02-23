import type { NetworkServer } from '../../network/abstract-network.server';
import type { IRegisterFunctions } from '../../network/network-host-interface.class';
import type { INetworkState } from '../../network/network.interfaces';
import type { TSynchronizerState } from '../../synchronizer/synchronizer';
import type { RPCServer } from '../rpc/rpc-server.class';

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

        // for (const key of Object.keys(this._registerFunctions) as Array<keyof IRegisterFunctions>) {
        //     this._rpcServer
        //         .registerMethod(
        //             key,
        //             this._registerFunctions[key],
        //         );
        // }
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