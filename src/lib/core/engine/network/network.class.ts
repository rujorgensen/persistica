/**
 * @version 
 *                  0.1.0
 * 
 * @changelog
 *                  0.1.0, 2025.02.11
 *                      - Initial version
 * 
 * @description
 *                  Client side network connector and interface.
 */
import { BehaviorSubject, type Observable, take } from 'rxjs';
import type { IKnownPeer, INetworkState, TClientId } from './network.interfaces';
import type { NetworkHostInterface } from './network-client-interface.class';
import type { NetworkServer } from './abstract-network.server';
import type { NetworkClient } from './abstract-network.client';
import {
    Persistica,
    type CurrentNetworkStore,
} from 'src/lib/persistica.class';

export type THandshakeState = 'disconnected' | 'connecting' | 'connected';

export class Network {
    public readonly state$$: Observable<THandshakeState>;
    private readonly _state$$: BehaviorSubject<THandshakeState> = new BehaviorSubject<THandshakeState>('disconnected');

    public readonly networkHostInterfaces$$: BehaviorSubject<Map<TClientId, NetworkHostInterface>> = new BehaviorSubject(new Map());

    private networkState: INetworkState;
    private readonly _networkStore: CurrentNetworkStore;

    constructor(
        private readonly _initialNetworkState: INetworkState,
        private readonly _networkServer: NetworkServer,
        private readonly _networkClient: NetworkClient,
    ) {
        this.networkState = structuredClone(this._initialNetworkState);
        this._networkStore = new Persistica().getNetworkStore(_initialNetworkState.networkId);
        this.state$$ = this._state$$.asObservable();
        this._networkStore
            .onUpdate$$()
            .subscribe({
                next: (networkState: INetworkState | undefined) => {
                    if (networkState) {
                        this.networkState = networkState;
                    }
                },
                error: () => {

                },
            });

        this._networkServer
            .onIncommingConnectionRequest((
                peerNetworkState: INetworkState,
            ): INetworkState => {
                return this.joinRequest(
                    peerNetworkState.clientId,
                    peerNetworkState,
                    peerNetworkState.networkKey,
                );
            });
    }

    // ******************************************************************************
    // *** 
    // ******************************************************************************

    /**
     * Sends a join request to the network.
     * 
     * @returns { Promise<void> }
     */
    public async sendJoinNetworkRequest(

    ): Promise<void> {
        this._state$$.next('connecting');

        // 1. Connect websocket
        await this._networkClient
            .connect()
            .catch(() => {
                console.log('[NW Client] Connection failed');

                this.disconnect();
            });

        // 2. Send join request
        const peerNetworkState: INetworkState = await this._networkClient
            .joinNetwork(
                this.networkState,
            );

        const peerNetworkClientInterface: NetworkHostInterface = this._networkClient.getPeerInterface();

        this.hostConnected(
            peerNetworkState.clientId,
            peerNetworkState,
            peerNetworkClientInterface,
        );
    }

    /**
     * @returns { Promise<void> }
     */
    public async disconnect(

    ): Promise<void> {
        this._state$$.next('disconnected');

        // 1. Disconnect websocket
        await this._networkClient.disconnect();
    }

    /**
     * Request to join a network.
     * 
     * @param { TClientId }         peerClientId
     * @param { INetworkState }     peerNetworkState
     * @param { string }            [networkKey]
     * 
     * @returns { INetworkState }
     */
    public joinRequest(
        peerClientId: TClientId,
        peerNetworkState: INetworkState,
        networkKey?: string,
    ): INetworkState {
        console.log(1);
        const isKnownPeer: boolean = this.isKnownPeer(peerClientId);
        if (
            // Unknown client
            !isKnownPeer &&
            // ... and the network key is not provided
            !(networkKey && (networkKey === this.networkState.networkKey))
        ) {
            throw new Error('Unknown peer or invalid network key');
        }

        this.clientConnected(
            peerClientId,
            peerNetworkState,
        );

        return this.networkState;
    };

    // ******************************************************************************
    // *** Network State
    // ******************************************************************************

    /**
     * Updates "lastSeenAt" and syncin deletes
     * 
     * @param { TClientId }             clientId
     * @param { INetworkState }         networkState
     * @param { NetworkHostInterface }  hostNetworkClientInterface
     * 
     * @returns { void }
     */
    private hostConnected(
        clientId: TClientId,
        networkState: INetworkState,
        hostNetworkClientInterface: NetworkHostInterface,
    ): void {
        this.clientConnected(
            clientId,
            networkState,
        );

        this.networkHostInterfaces$$
            .pipe(
                take(1),
            )
            .subscribe({
                next: (map: Map<TClientId, NetworkHostInterface>) => {
                    map.set(
                        clientId,
                        hostNetworkClientInterface,
                    );

                    this.networkHostInterfaces$$.next(map);
                },
            });
    }

    /**
     * Updates "lastSeenAt" and synchronizing deletes
     * 
     * @param { TClientId }         clientId
     * @param { INetworkState }     networkState
     * 
     * @returns { void }
     */
    private clientConnected(
        clientId: TClientId,
        networkState: INetworkState,
    ): void {
        const client: IKnownPeer | undefined = this.networkState.knownPeers.find((peer) => peer.clientId === clientId);

        if (client) {
            client.lastSeenAt = new Date();
        } else {
            this.networkState.knownPeers.push({
                clientId,
                lastSeenAt: new Date(),
            });
        }

        this.networkState.deletes = syncDeletes(
            clientId,
            this.networkState.clientId,
            this.networkState.deletes,
            networkState.deletes,
        );
        this._networkStore.update(this.networkState);

        this._state$$.next('connected');
    }

    /**
     * 
     * @param { TClientId }     peerClientId
     * 
     * @returns { boolean }
     */
    private isKnownPeer(
        peerClientId: TClientId,
    ): boolean {
        return !!this.networkState.knownPeers.find((peer) => peer.clientId === peerClientId);
    }
}