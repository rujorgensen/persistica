import { NetworkHostInterface } from './network-client-interface.class';
import { INetworkState } from "./network.interfaces";

export abstract class NetworkClient {
    public abstract connect(

    ): Promise<void>;

    public abstract joinNetwork(
        networkState: INetworkState,
    ): Promise<INetworkState>;

    public abstract getPeerInterface(
    ): NetworkHostInterface;
}