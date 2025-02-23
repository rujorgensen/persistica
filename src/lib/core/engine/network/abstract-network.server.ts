import type { TSynchronizerState } from '../synchronizer/synchronizer';
import type { INetworkState } from './network.interfaces';

export abstract class NetworkServer {

    public abstract onIncommingConnectionRequest(
        fn: (
            peerNetworkState: INetworkState,
        ) => INetworkState): void;

    public abstract onEmitSynchronizationState(
        fn: (
            state: TSynchronizerState,
        ) => void): void;
}