import { BaseStore } from '../../base.store';
import { INetworkState } from '../network/network.interfaces';
import { PersistenceWrapper } from '../persistence.wrapper';

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
