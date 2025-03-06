/**
 * Network server
 */
import type { NetworkServer } from '../../network/abstract-network.server.ts';
import type { IRegisterFunctions } from '../../network/network-host-interface.class.ts';
import type { INetworkState } from '../../network/network.interfaces.ts';
import type { TSynchronizerState } from '../../synchronizer/synchronizer.ts';
import type { RPCServer } from '../rpc/rpc-server.class.ts';

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