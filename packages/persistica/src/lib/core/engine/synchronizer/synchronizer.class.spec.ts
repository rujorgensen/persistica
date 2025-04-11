import { it, describe, expect, vi } from 'vitest'
import { filter, BehaviorSubject, of, firstValueFrom } from 'rxjs';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import {
    type TSynchronizerState,
    Synchronizer,
} from './synchronizer';
import type { NetworkHostInterface } from '../network/network-host-interface.class';
import type { TDataType } from './synchronizer-state-detector.fn';
import type { TUniqueIdentifier } from '../_types/element.type';
import type { SynchronizableStorage } from './abstract-synchronizable-storage.class';
import { beforeEach } from 'node:test';
// class MockSynchronizableStorage implements SynchronizableStorage {

// }

// const mockSynchronizableStorage = new MockSynchronizableStorage();

// class MockNetworkHostWebsocketInterface implements NetworkHostInterface {

// }

const mockStorageHash$$ = new BehaviorSubject('ahshshshhasdjkahsdjkash');
const mockNetworkHash$$ = new BehaviorSubject('databas-hash');
let onAnyCreateCB: (tn: string, v: ReadonlyArray<TDataType<any>>) => void;

const mockSynchronizableStorage = {
    hash$$: mockStorageHash$$,
    state$$: of('ready'),
    onAnyCreate: (
        fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void,
    ) => {
        onAnyCreateCB = fn;
    },
    onAnyUpdate: (
        fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void,
    ) => {

    },
    onAnyDelete: (
        fn: (tn: string, v: ReadonlyArray<TDataType<any>>) => void,
    ) => {

    },
    create: <T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void> => {
        return Promise.resolve();
    },
    update: <T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ): Promise<void> => {
        return Promise.resolve();
    },
    delete: (
        tableName: string,
        data: TUniqueIdentifier | TUniqueIdentifier[] | TDataType<any> | ReadonlyArray<TDataType<any>>,
    ): Promise<void> => {
        return Promise.resolve();
    },

    rowIterator: (
        tableName: string,
        value: (r: any) => void,
    ): Promise<void> => {
        return Promise.resolve();
    },

    readTableNames: (

    ): ReadonlyArray<string> => {
        return [
            'dummy-table-1',
            'dummy-table-2',
            'dummy-table-3',
        ];
    },

    readElementAt: <T>(
        tableName: string,
        index: number,
    ): Promise<TDataType<T> | undefined> => {
        return Promise.resolve(undefined);
    },
    readRowCount: (
        tableName: string,
    ): Promise<number> => {
        return Promise.resolve(0);
    },
    readTableHash: (
        tableName: string,
    ): Promise<string | undefined> => {
        return Promise.resolve(`${tableName}-hash-storage`);
    },
    readTableRowHash: (
        tableName: string,
        rowIndex: number,
    ): Promise<string | undefined> => {
        return Promise.resolve(undefined);
    },

} as SynchronizableStorage;

const mockNetworkHostInterface = {
    databaseHash$$: mockNetworkHash$$.asObservable(),

    onCreate: <T>(
        fn: (
            tableName: string, v: ReadonlyArray<TDataType<T>>,
        ) => void,
    ) => {
    },
    onUpdate: <T>(
        fn: (
            tableName: string, v: ReadonlyArray<TDataType<T>>,
        ) => void,
    ) => {

    },
    onDelete: <T>(
        fn: (
            tableName: string, v: ReadonlyArray<TDataType<T>>,
        ) => void,
    ) => {
    },

    readBatchAt: <T>(
        tableName: string,
        index: number,
        batchSize: number,
    ): Promise<ReadonlyArray<TDataType<T>>> => {
        return Promise.resolve([]);
    },

    readElementAt: <T>(
        tableName: string,
        index: number,
    ): Promise<TDataType<T> | undefined> => {
        return Promise.resolve(undefined);
    },

    create: <T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ) => {

    },

    update: <T>(
        tableName: string,
        data: ReadonlyArray<TDataType<T>>,
    ) => {

    },

    delete: (
        tableName: string,
        data: TUniqueIdentifier[],
    ): Promise<void> => {
        return Promise.resolve();
    },


    readDatabaseHash: (

    ): Promise<string> => {
        return Promise.resolve('dbhashshssh');
    },

    readRowCount: (
        tableName: string,
    ): Promise<number> => {
        return Promise.resolve(0);
    },

    readTableHash: (
        tableName: string,
    ): Promise<string | undefined> => {
        return Promise.resolve(`${tableName}-hash-network`);
    },

    readTableRowHash: (
        tableName: string,
        rowIndex: number,
    ): Promise<string | undefined> => {
        return Promise.resolve(undefined);
    },

    emitSynchronizationState: (
        state: TSynchronizerState,
    ): Promise<void> => {
        return Promise.resolve(void 0);
    }
} as NetworkHostInterface;

describe('Synchronizer', () => {

    it('should start by deleting locally deleted elements from the server', async () => {

        const synchronizer: Synchronizer = new Synchronizer(
            [
                {
                    tableName: 'some table-name',
                    deletes: [
                        {
                            cuid: 'cuid-123',
                            synchronizedWith: [
                                // Not yet synchronized with anyone
                            ],
                        },
                    ],
                },
            ],
            [],
            mockSynchronizableStorage,
            mockNetworkHostInterface,
        );

        const clientSynchronizerStateSpy = subscribeSpyTo(synchronizer.state$$);

        expect(clientSynchronizerStateSpy.getLastValue()).toBe('synchronizing-deletes');
    });

    describe('synchronized state', () => {
        it('should settle in synchronized state', async () => {
            mockStorageHash$$.next('hash');
            mockNetworkHash$$.next('hash');

            const synchronizer: Synchronizer = new Synchronizer(
                [],
                [],
                mockSynchronizableStorage,
                mockNetworkHostInterface,
            );

            // vi.spyOn(mockSynchronizableStorage, 'hash$$').mockReturnValue(of('new-hash'));
            await firstValueFrom(
                synchronizer.state$$
                    .pipe(
                        filter((state) => state === 'synchronized')
                    ),
            );

            const clientSynchronizerStateSpy = subscribeSpyTo(synchronizer.state$$);

            expect(clientSynchronizerStateSpy.getLastValue()).toBe('synchronized');
        });

        it('should replay local creates on the server', async () => {
            mockStorageHash$$.next('hash');
            mockNetworkHash$$.next('hash');
            const spy = vi.spyOn(mockNetworkHostInterface, 'create');

            const synchronizer: Synchronizer = new Synchronizer(
                [],
                [],
                mockSynchronizableStorage,
                mockNetworkHostInterface,
            );

            await firstValueFrom(
                synchronizer.state$$
                    .pipe(
                        filter((state) => state === 'synchronized')
                    ),
            );

            onAnyCreateCB('table-name', [
                {
                    d: 'data-piece',
                    hash: 'hashshs',
                    pcuid: 'string;',
                    createdBy: 'The Creator',
                },
            ]);

            expect(spy).toHaveBeenLastCalledWith('table-name', [{
                d: 'data-piece',
                hash: 'hashshs',
                pcuid: 'string;',
                createdBy: 'The Creator',
            }],);
        });
    });
});