import type { NetworkHostInterface } from './network-host-interface.class';
import type { INetworkState } from "./network.interfaces";

export abstract class NetworkClient {
    public abstract connect(

    ): Promise<void>;

    public abstract disconnect(

    ): Promise<void>;

    public abstract joinNetwork(
        networkState: INetworkState,
    ): Promise<INetworkState>;

    public abstract getPeerInterface(
    ): NetworkHostInterface;
}