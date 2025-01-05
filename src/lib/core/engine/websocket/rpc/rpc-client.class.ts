/**
 * The class to handling the *calling* side of the RPC.
 */
import { IRPCCallback } from '../shared/websocket.interfaces';
import { RPCResponse, TCallback } from './rpc.interfaces';

export class RPCClient {
    private requestId: number = 0;
    private readonly pendingRequests: Map<number, TCallback> = new Map();

    constructor(
        private readonly sendToRPCServer: (
            data: string,
        ) => void,
    ) { }

    /**
     * 
     * @param method 
     * @param params 
     * 
     * @returns 
     */
    public call(
        method: string,
        ...params: any
    ): Promise<any> {
        const id: number = this.requestId++;

        const rpcCallback: IRPCCallback = {
            type: 'rpc-request',
            payload: {
                id,
                method,
                params: params[0],
            },
        };

        return new Promise((resolve) => {
            this.pendingRequests.set(id, resolve);

            this.sendToRPCServer(JSON.stringify(rpcCallback));
        });
    }

    /**
     * Handles the response from the server.
     * 
     * @param { RPCResponse }   response
     *  
     * @returns { void } 
     */
    public handleMessage(
        response: RPCResponse,
    ): void {
        const cb: TCallback | undefined = this.pendingRequests.get(response.id);

        if (cb) {
            if (response.error){
                throw new Error(response.error);
            }

            cb(response.result);
            this.pendingRequests.delete(response.id);
        }
    }
}
