import { NetworkServer } from '../../network/abstract-network.server';
import { IRegisterFunctions } from '../../network/network-client-interface.class';
import { INetworkState } from '../../network/network.interfaces';
import { PersisticaWebsocketServer } from '../websocket.server';

export class NetworkWebsocketServer implements NetworkServer {

    constructor(
        private readonly _server: PersisticaWebsocketServer,
        private readonly _registerFunctions: IRegisterFunctions,
    ) {
        // Register functions
        const functions = Object.entries(this._registerFunctions);
        console.log('Registering functions:', functions);
        for (const [key, value] of functions) {
            this._server.rpcServer
                .registerMethod(
                    key,
                    value,
                );
        }
    }

    /**
     * 
     */
    public listen(

    ): void {
        console.log('Server is always listening');
    }

    /**
     * 
     * @param fn 
     */
    public onIncommingConnectionRequest(
        fn: (
            peerNetworkState: INetworkState,
        ) => INetworkState,
    ): void {

        this._server.rpcServer.registerMethod(
            'joinNetwork',              // RPC method name
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