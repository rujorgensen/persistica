import type { NetworkServer } from '../../network/abstract-network.server';
import type { INetworkState } from '../../network/network.interfaces';

export class DummyNetworkServer implements NetworkServer {

    public onIncommingConnectionRequest(
        fn: (
            peerNetworkState: INetworkState,
        ) => INetworkState): void {
        console.log('onIncommingConnectionRequest method not implemented.');
    }
}