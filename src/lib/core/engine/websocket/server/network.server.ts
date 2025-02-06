import type { NetworkServer } from '../../network/abstract-network.server';
import type { IRegisterFunctions } from '../../network/network-client-interface.class';
import type { INetworkState } from '../../network/network.interfaces';
import type { PersisticaWebsocketServer } from '../websocket.server';

export class NetworkWebsocketServer implements NetworkServer {

    constructor(
        private readonly _server: PersisticaWebsocketServer,
        private readonly _registerFunctions: IRegisterFunctions,
    ) {
        // Register functions
        const functions = Object.entries(this._registerFunctions);
        console.log(`Registering ${Object.keys(this._registerFunctions).length} RPC functions`);
        for (const [key, value] of functions) {
            // console.log(`Registering RPC function: "${key}"`);
            this._server.rpcServer
                .registerMethod(
                    key,
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
        this._server.rpcServer.registerMethod(
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
}