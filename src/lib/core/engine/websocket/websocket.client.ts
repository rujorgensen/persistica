import { BehaviorSubject, map, type Observable } from 'rxjs';
import type { TChannel, TMessage } from './shared/websocket.interfaces';
import type { TLocalStoreState } from '../persistence.wrapper';
import { RPCClient } from './rpc/rpc-client.class';
import type { IRegisterFunctions } from '../network/network-client-interface.class';
import type { TDataType } from '../synchronizer/synchronizer-state-detector.fn';

export type TConnectionState = 'disconnected' | 'connecting' | 'connected';

export class PersisticaWebsocketClient {
    public readonly isConnected$$: Observable<boolean>;

    public readonly connectionState$$: Observable<TConnectionState>;
    private readonly channelListeners: Map<TChannel, Set<(_: any) => void>> = new Map([
        ['data', new Set()],
        ['state', new Set()],
        ['version', new Set()],
        ['databaseHash', new Set()],
        ['onCreate', new Set()],
        ['onUpdate', new Set()],
        ['onDelete', new Set()],
    ]);

    private readonly _connectionState$$: BehaviorSubject<TConnectionState> = new BehaviorSubject<TConnectionState>(
        'disconnected'
    );

    private connectedWebSocket: WebSocket | undefined;
    private rpcClient: RPCClient | undefined;

    constructor(
        private readonly port: number,
    ) {
        this.connectionState$$ = this._connectionState$$.asObservable();
        this.isConnected$$ = this.connectionState$$
            .pipe(
                map((wss: TConnectionState): boolean => wss === 'connected'),
            );
    }

    public connect(

    ): Promise<void> {
        if (
            (typeof window === 'undefined') &&
            (typeof WebSocket === 'undefined')
        ) {
            this._connectionState$$.next('disconnected');

            return Promise.reject(new Error('WebSocket is not supported in this environment.'));
        }

        return new Promise((resolve, reject) => {

            const createWSClient = (
                port: number,
            ) => {
                this._connectionState$$.next('connecting');

                const webSocket = new WebSocket(`ws://localhost:${port}`);

                this.rpcClient = new RPCClient(
                    webSocket.send.bind(webSocket)
                );

                webSocket.onopen = () => {
                    console.log('🔌 WebSocket connection established.');
                    this._connectionState$$.next('connected');
                    resolve();
                    this.connectedWebSocket = webSocket;
                };

                webSocket.onmessage = (
                    event: MessageEvent,
                ) => {
                    const {
                        type,
                        payload,
                    } = JSON.parse(event.data.toString()) as TMessage;

                    console.log(`🔌 Incomming data type: "${type}"`);

                    switch (type) {
                        case 'message':

                            for (const fn of this.channelListeners.get(payload.channel) ?? []) {
                                fn(...payload.data);
                            }

                            break;

                        case 'rpc-response':
                            this.rpcClient?.handleMessage(payload);

                            break;

                        default:
                            console.log('🔌 [WebSocket] unhandled type:', type);
                            break;
                    }
                };

                webSocket.onerror = (error: Event) => {
                    this.connectedWebSocket = undefined;
                    this._connectionState$$.next('disconnected');
                    console.error('WebSocket Error:', error);
                    reject(new Error(error.toString()));
                };

                webSocket.onclose = (event: CloseEvent) => {
                    this.connectedWebSocket = undefined;
                    this._connectionState$$.next('disconnected');
                    console.log('🔌 WebSocket connection closed:', event);
                    reject(new Error(event.reason));
                };
            };

            const connect = (

            ): void => {
                try {
                    createWSClient(this.port);
                } catch {
                    console.log('🔌 Failed to connect to WebSocket server. Retrying in 1 second...');
                    setTimeout(() => {
                        console.log('🔌 Retrying to connect to WebSocket server...');
                        connect();
                    }, 1_000);
                }
            };

            connect();
        });
    }

    public disconnect(

    ): Promise<void> {
        if (this.connectedWebSocket) {
            this.connectedWebSocket?.close();
            this._connectionState$$.next('disconnected');
        }

        return Promise.resolve();
    }

    public callRemoteProcedure(
        procedureName: (keyof IRegisterFunctions) | 'joinNetwork',
        ...params: any[]
    ): Promise<any> {
        if (!this.rpcClient) {
            throw new Error('RPC client is not initialized.');
        }

        return this.rpcClient.call(procedureName, params);
    }

    // ******************************************************************************
    // *** Receive events from the client
    // ******************************************************************************
    public onRemoteState(
        fn: (
            state: TLocalStoreState,
        ) => void,
    ): void {
        this.joinChannel('state');
        this.channelListeners.get('state')?.add(fn);
    }

    public onRemoteVersion(
        fn: (
            state: number,
        ) => void,
    ): void {
        this.joinChannel('version');
        this.channelListeners.get('version')?.add(fn);
    }

    public onRemoteDatabaseHash(
        fn: (
            state: string,
        ) => void,
    ): void {
        this.joinChannel('databaseHash');
        this.channelListeners.get('databaseHash')?.add(fn);
    }

    public onCreate(
        fn: (
            tn: string,
            v: ReadonlyArray<TDataType<any>>,
        ) => void,
    ): void {
        this.joinChannel('onCreate');
        this.channelListeners.get('onCreate')?.add(fn);
    }

    public onUpdate(
        fn: (
            tn: string,
            v: ReadonlyArray<TDataType<any>>,
        ) => void,
    ): void {
        this.joinChannel('onUpdate');
        this.channelListeners.get('onUpdate')?.add(fn);
    }

    public onDelete(
        fn: (
            tn: string,
            v: ReadonlyArray<TDataType<any>>,
        ) => void,
    ): void {
        this.joinChannel('onDelete');
        this.channelListeners.get('onDelete')?.add(fn);
    }

    // ******************************************************************************
    // *** Internal Helpers
    // ******************************************************************************
    private joinChannel(
        channel: TChannel,
    ): void {
        if (!this.connectedWebSocket) {
            throw new Error('WebSocket is not connected.');
        }

        const message: TMessage = {
            type: 'join',
            payload: channel,
        };

        this.connectedWebSocket.send(JSON.stringify(message));
    }
}