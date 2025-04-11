/**
 * The class to handling the *calling* side of the RPC.
 */
import type { IRPCCallback } from '../shared/websocket.interfaces.ts';
import type { RPCResponse, TCallback } from './rpc.interfaces.ts';

export class RPCClient<TMethods> {
    private requestId: number = 0;
    private readonly pendingRequests: Map<number, TCallback> = new Map();

    constructor(
        private readonly sendToRPCServer: (
            data: string,
        ) => void,
    ) { }

    /**
     * Calls a function on the other side.
     * 
     * @param { TMethods } method
     * @param { any } params
     * 
     * @returns 
     */
    public call(
        method: TMethods,
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
     * Handles the response from the RPC server.
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
            if (response.error) {
                throw new Error(response.error);
            }

            cb(response.result);
            this.pendingRequests.delete(response.id);
        }
    }
}
