export type TNetworkId = `ni-${string}`;
export type TClientId = `ci-${string}`;

export interface IDeleted {
    cuid: string;
    synchronizedWith: TClientId[];
}

export interface IKnownPeer {
    clientId: TClientId;
    lastSeenAt: Date;
}

export interface INetworkState {
    networkId: TNetworkId;
    networkKey: string; // Only keep locally, remove when transferring
    clientId: TClientId;
    version: number;
    knownPeers: IKnownPeer[];
    deletes: IDeleted[];
}