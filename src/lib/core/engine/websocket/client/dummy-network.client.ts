/**
 * Does not do anyhing
 */
import type { NetworkClient } from '../../network/abstract-network.client';
import type { NetworkHostInterface } from '../../network/network-client-interface.class';
import type { INetworkState } from '../../network/network.interfaces';

export class DummyNetworkClient implements NetworkClient {

    public connect(

    ): Promise<void> {
        throw new Error('connect method not implemented.');
    }

    public joinNetwork(
        networkState: INetworkState,
    ): Promise<INetworkState> {
        throw new Error('joinNetwork method not implemented.');
    }

    public getPeerInterface(
    ): NetworkHostInterface {
        throw new Error('getPeerInterface method not implemented.');
    }
}
