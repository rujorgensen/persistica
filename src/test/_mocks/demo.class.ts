
import { DemoModel } from './demo.model.js';
import type { DemoInterface } from './demo.interface.ts';
import type { INetworkState } from '../../lib/core/index.ts';
import {
    type TDateAsString,
    LocalClient,
} from '@persistica/core';
import type { RPCServer } from 'src/lib/core/engine/websocket/rpc/rpc-server.class.ts';

export const instantiate = (
    db: IDBDatabase,
): void => {
    if (!db.objectStoreNames.contains('DemoModel')) {
        const dataFrameStore = db.createObjectStore('DemoModel', { keyPath: '_idx', autoIncrement: true });
        dataFrameStore.createIndex('_idx', '_idx', { unique: true });

        dataFrameStore.createIndex('id', 'id', { unique: true });
        dataFrameStore.createIndex('createdAt', 'createdAt', { unique: false });
    }
};

/** 
 * Parse the data from the database 
 */
export const parser = (
    value: TDateAsString<DemoInterface>,
): DemoInterface => {

    return {
        ...value,
        // Instantiate dates
        createdAt: new Date(value.createdAt),
    };
};

type TTableTypeMap = {
    DemoModel: DemoInterface;
};

type TDBTableType = 'DemoModel';

export class Demo extends LocalClient<TTableTypeMap, TDBTableType> {

    // * Models
    public readonly demoModel: DemoModel;

    constructor(
        private readonly rpcServer_: RPCServer<'emitSynchronizationState' | 'joinNetwork'>,
        private readonly networkState_: INetworkState,
    ) {
        super(
            {
                webSocketPort: 3_000,
            },
            networkState_,
            [
                instantiate,
            ],
            {
                DemoModel: parser,
            },
            // Return unique identiier
            {
                DemoModel: {
                    resolve: (
                        _element: unknown,
                    ) => {
                        return 'id';
                    },
                    indexName: 'id',
                },
            },
            // REMOVE!!! 
            rpcServer_,
        );

        this.demoModel = new DemoModel(this.store);
    }
}