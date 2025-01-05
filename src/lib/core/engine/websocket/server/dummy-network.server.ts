import { NetworkServer } from '../../network/abstract-network.server';
import { INetworkState } from '../../network/network.interfaces';

export class DummyNetworkServer implements NetworkServer {

    public listen(

    ): void {
        throw new Error('listen method not implemented.');
    }

    public onIncommingConnectionRequest(
        fn: (
            peerNetworkState: INetworkState,
        ) => INetworkState): void {
        console.log('onIncommingConnectionRequest method not implemented.');
    }
}