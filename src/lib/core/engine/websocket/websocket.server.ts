/**
 * @version 
 *                  0.1.0
 * 
 * @changelog
 *                  0.1.0, 2025.02.06
 *                      - Initial version
 * 
 * @description
 *                  This file contains the WebSocket server class.
 */
import { BehaviorSubject, map, tap, type Observable } from 'rxjs';
import WebSocket, { WebSocketServer, type MessageEvent } from 'ws';
import type { IChannelMessage, TChannel, TMessage } from './shared/websocket.interfaces';
import { RPCClient } from './rpc/rpc-client.class';
import { RPCServer } from './rpc/rpc-server.class';
import type { RPCResponse } from './rpc/rpc.interfaces';

type BufferLike =
    | string
    | Buffer
    | DataView
    | number
    | ArrayBufferView
    | Uint8Array
    | ArrayBuffer
    | SharedArrayBuffer
    | readonly any[]
    | readonly number[]
    | { valueOf(): ArrayBuffer; }
    | { valueOf(): SharedArrayBuffer; }
    | { valueOf(): Uint8Array; }
    | { valueOf(): readonly number[]; }
    | { valueOf(): string; }
    | { [Symbol.toPrimitive](hint: string): string; }
    ;

export class PersisticaWebsocketServer {
    public readonly isListening$$: Observable<boolean>;

    private readonly wss: BehaviorSubject<WebSocketServer | undefined> = new BehaviorSubject<WebSocketServer | undefined>(undefined);

    private readonly channels: Map<TChannel, Set<WebSocket>> = new Map();
    private readonly channelListeners: Map<TChannel, Set<(data: any) => void>> = new Map([
        ['data', new Set()],
        ['state', new Set()],
        ['version', new Set()],
        ['databaseHash', new Set()],
    ]);
    public readonly rpcServer: RPCServer = new RPCServer();
    public readonly connectedClients: Set<WebSocket> = new Set();

    constructor(
        port: number,
    ) {
        console.log(`Creating WS server on port: ${port}`);
        const webSocketServer = new WebSocketServer({ port });

        // * Register RPC methods
        this.isListening$$ = this.wss
            .pipe(
                map((wss: WebSocketServer | undefined) => wss !== undefined),
            );

        webSocketServer
            .on('listening', () => {
                console.log(`WS Server is now listening on port ${port}`);
                this.wss.next(webSocketServer);
            });

        webSocketServer
            .on('connection', (webSocket: WebSocket) => {
                // * Register RPC methods (yes, the RPC client is on the server)
                const rpcClient: RPCClient = new RPCClient(webSocket.send);

                console.log('Connection established');

                this.connectedClients.add(webSocket);
                webSocket.onerror = console.error;

                webSocket.onmessage = (
                    event: MessageEvent,
                ): void => {
                    const message: TMessage = JSON.parse(event.data.toString());
                    const {
                        type,
                        payload,
                    } = message;

                    switch (type) {
                        case 'join':

                            // If channel does not exist, create it
                            if (!this.channels.has(payload)) {
                                this.channels.set(payload, new Set());
                            }

                            // Add client to channel
                            this.channels.get(payload)?.add(webSocket);

                            break;

                        case 'rpc-request':

                            this.rpcServer
                                .handleMessage(
                                    payload,
                                    (
                                        data: RPCResponse,
                                    ) => webSocket.send(JSON.stringify({
                                        type: 'rpc-response',
                                        payload: data,
                                    })),
                                );

                            break;
                        case 'rpc-response':

                            rpcClient.handleMessage(payload);

                            break;
                        case 'message':
                            const clients: Set<(data: unknown) => void> | undefined = this.channelListeners.get(payload.channel);

                            if (clients) {
                                for (const client of clients) {
                                    client(event);
                                }
                            }

                            break;

                        default:
                            console.log('[WebSocket] unhandled tpye:', type);
                            break;
                    }
                };

                // Unsubscribe from all channels
                webSocket.onclose = () => {
                    this.channels.forEach((clients: Set<WebSocket>) => {
                        if (clients.has(webSocket)) {
                            clients.delete(webSocket);
                        }
                    });

                    this.connectedClients.delete(webSocket);
                };
            });
    };

    /**
     * Emits a message to a channel.
     * 
     * @param { TChannel }      channel
     * @param { BufferLike }    data
     * 
     * @returns { void }
     */
    public emit(
        channel: TChannel,
        data: BufferLike[],
    ): void {
        if (!this.wss) {
            throw new Error('WS server not ready');
        }

        const clients: Set<WebSocket> | undefined = this.channels.get(channel);
        const channelMessage: IChannelMessage = {
            type: 'message',
            payload: {
                channel: channel,
                data: data.map((a) => a.toString()),
            }
        };

        const socketPacket: string = JSON.stringify(channelMessage);

        for (const client of (clients ?? [])) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(socketPacket);
            }
        }
    }

    /**
     * Close the WebSocket server.
     * 
     * @throws { Error } If the server is not running.
     * 
     * @returns { Promise<void> }
     */
    public close(
    ): Promise<void> {
        return new Promise((resolve, reject) => {

            if (this.wss.value) {
                this.wss.value.close(() => {
                    console.log('WebSocket server closed');
                    resolve();
                });

                return;
            }

            reject(new Error('No server running'));
        });
    }
}
