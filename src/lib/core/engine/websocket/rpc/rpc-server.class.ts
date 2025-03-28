/**
 * The class to handling the *called* side of the RPC.
 */
import type { RPCRequest, RPCResponse } from './rpc.interfaces.ts';

type TCallback = (...args: any) => any;

export class RPCServer<TMethodName extends string> {
    private readonly methods: Map<TMethodName, TCallback> = new Map();

    /**
     * 
     * @param { string }        name
     * @param { TCallback }     fn
     * 
     * @returns { void }
     */
    public registerMethod(
        name: TMethodName,
        fn: TCallback,
    ): void {
        this.methods.set(name, fn);
    }

    /**
     * Handles the request from the client.
     * 
     * @param { RPCRequest }    request
     * @param { Function }      sendToRPCClient
     * 
     * @returns { void } 
     */
    public async handleMessage(
        request: RPCRequest<TMethodName>,

        sendToRPCClient: (
            data: RPCResponse,
        ) => void,
    ): Promise<void> {
        const response: RPCResponse = {
            id: request.id,
            result: null,
        };

        const method: TCallback | undefined = this.methods.get(request.method);

        if (method) {
            try {
                response.result = await method(...request.params);
            } catch (error) {
                response.error = (error as Error).message;
            }
        } else {
            response.error = `Method "${request.method}" not found`;
        }

        // Send back the response to the client
        sendToRPCClient(response);
    }
}
