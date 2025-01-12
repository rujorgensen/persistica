import type { INetworkState } from './network.interfaces';

export abstract class NetworkServer {
    public abstract listen(): void;

    public abstract onIncommingConnectionRequest(
        fn: (
            peerNetworkState: INetworkState,
        ) => INetworkState): void;
}