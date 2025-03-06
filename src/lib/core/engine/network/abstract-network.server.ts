import type { TSynchronizerState } from '../synchronizer/synchronizer.ts';
import type { INetworkState } from './network.interfaces.ts';

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