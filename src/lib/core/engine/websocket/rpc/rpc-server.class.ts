/**
 * The class to handling the *called* side of the RPC.
 */
import { RPCRequest, RPCResponse } from './rpc.interfaces';

type TCallback = (...args: any) => any;

export class RPCServer {
    private readonly methods: Map<string, TCallback> = new Map();

    /**
     * 
     * @param { string }        name
     * @param { TCallback }     fn
     * 
     * @returns { void }
     */
    public registerMethod(
        name: string,
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
        request: RPCRequest,

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
