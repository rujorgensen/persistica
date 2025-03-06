/*
import { Network } from '../network.class';
import { IDeleted, INetworkState, TNetworkId } from '../network.interfaces';

const networkKey: string = '5eCr3TnetworkKey$';


export const connectKnownClient = (
    netWorkADeletes?: IDeleted[],
    netWorkBDeletes?: IDeleted[],
): [Network, Network] => {
    const netWorkId: TNetworkId = 'ni-3k_?';

    const clientANetworkState: INetworkState = {
        version: 1,
        knownPeers: [
            {
                clientId: 'ci-clientB',
                lastSeenAt: new Date(),
            },
        ],
        deletes: netWorkADeletes ?? [],
    };

    const netWorkA: Network = new Network(
        netWorkId,
        'ci-clientA',
        clientANetworkState,
        networkKey,
    );

    const netWorkB: Network = new Network(
        netWorkId,
        'ci-clientB',
        {
            version: 1,
            knownPeers: [{
                clientId: 'ci-clientA',
                lastSeenAt: new Date(),
            }],
            deletes: netWorkBDeletes ?? [],
        },
        networkKey,
    );

    netWorkA.joinNetworkAttempt('ci-clientB', netWorkB.joinRequest.bind(netWorkB));

    return [netWorkA, netWorkB];
};

export const connectNewClient = (
    netWorkADeletes?: IDeleted[],
    netWorkBDeletes?: IDeleted[],
): [Network, Network] => {
    const netWorkId: TNetworkId = 'ni-3k_?';
    const netWorkA: Network = new Network(
        netWorkId,
        'ci-clientA',
        {
            version: 1,
            knownPeers: [],
            deletes: netWorkADeletes ?? [],
        },
        networkKey,
    );

    const netWorkB: Network = new Network(
        netWorkId,
        'ci-clientB',
        {
            version: 1,
            knownPeers: [],
            deletes: netWorkBDeletes ?? [],
        },
        networkKey,
    );

    netWorkA.joinNetworkAttempt('ci-clientB', netWorkB.joinRequest.bind(netWorkB));

    return [netWorkA, netWorkB];
};
 */