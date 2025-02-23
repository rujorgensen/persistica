/**
 * Implements the local client class.
 * 
 * Move as much as possible here.
 */
import type { Observable } from 'rxjs';
import { PersisticaWebsocketClient, type TConnectionState } from './engine/websocket/websocket.client';

export class LocalClient {

    // * States
    public readonly websocketState$$: Observable<TConnectionState>;

    protected readonly websocketClient: PersisticaWebsocketClient;

    constructor(
        private readonly configuration: {
            webSocketPort: number
        },
    ) {
        this.websocketClient = new PersisticaWebsocketClient(this.configuration.webSocketPort);
        this.websocketState$$ = this.websocketClient.connectionState$$;
    }
}