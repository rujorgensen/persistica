import { BaseStore } from '../../base.store';
import type { INetworkState } from '../network/network.interfaces';
import type { PersistenceWrapper } from '../persistence.wrapper';

export class NetworkStore extends BaseStore<'NetworkConfigurationStore', INetworkState> {

    constructor(
        private readonly _store: PersistenceWrapper,
    ) {
        super(
            'NetworkConfigurationStore',
            _store,
        );
    }

}
