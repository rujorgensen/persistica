import { it, describe, vi, expect, beforeEach } from 'vitest';
import { replayDeletes } from './sync-deletes.fn';

describe('syncDeletes', () => {
    const deleteRemotelyMock = vi.fn().mockResolvedValue(undefined);
    const deleteLocallylyMock = vi.fn().mockResolvedValue(undefined);
    //     const notifyRemoteThatDeletesAreSyncedOnLocalMock = vi.fn().mockResolvedValue(undefined);
    //     const notifyRemoteThatDeletesAreSyncedOnRemoteMock = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should delete local deletes remotely', async () => {
        await replayDeletes(
            [
                {
                    tableName: 'some-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-1',
                            synchronizedWith: [],
                        },
                    ],
                },
                {
                    tableName: 'another-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-2',
                            synchronizedWith: [],
                        },
                        {
                            cuid: 'cuid-3',
                            synchronizedWith: [],
                        },
                    ],
                },
            ],
            [],
            deleteLocallylyMock,
            deleteRemotelyMock,
            // notifyRemoteThatDeletesAreSyncedOnLocalMock,
            // notifyRemoteThatDeletesAreSyncedOnRemoteMock,
        );

        expect(deleteRemotelyMock).toHaveBeenNthCalledWith(
            1,
            'some-table-name', ['cuid-1'],
        );

        expect(deleteRemotelyMock).toHaveBeenNthCalledWith(
            2,
            'another-table-name', ['cuid-2', 'cuid-3'],
        );
    });

    it('Should delete remote deletes locally', async () => {
        await replayDeletes(
            [],
            [
                {
                    tableName: 'some-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-1',
                            synchronizedWith: [],
                        },
                    ],
                },
                {
                    tableName: 'another-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-2',
                            synchronizedWith: [],
                        },
                        {
                            cuid: 'cuid-3',
                            synchronizedWith: [],
                        },
                    ],
                },
            ],
            deleteLocallylyMock,
            deleteRemotelyMock,
            //    notifyRemoteThatDeletesAreSyncedOnLocalMock,
            //    notifyRemoteThatDeletesAreSyncedOnRemoteMock,
        );

        expect(deleteLocallylyMock).toHaveBeenNthCalledWith(
            1,
            'some-table-name', ['cuid-1'],
        );

        expect(deleteLocallylyMock).toHaveBeenNthCalledWith(
            2,
            'another-table-name', ['cuid-2', 'cuid-3'],
        );
    });

    /*

    it('Should notify remote that its deletes has been synchronized with local', async () => {
        await syncDeletes(
            [],
            [
                {
                    tableName: 'some-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-1',
                            synchronizedWith: [],
                        },
                    ],
                },
                {
                    tableName: 'another-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-2',
                            synchronizedWith: [],
                        },
                        {
                            cuid: 'cuid-3',
                            synchronizedWith: [],
                        },
                    ],
                },
            ],
            deleteLocallylyMock,
            deleteRemotelyMock,
            //    notifyRemoteThatDeletesAreSyncedOnRemoteMock,
            //    notifyRemoteThatDeletesAreSyncedOnRemoteMock,
        );

        expect(notifyRemoteThatDeletesAreSyncedOnLocalMock).toHaveBeenCalledWith('success');
    });

    it('Should notify local that its deletes has been synchronized with remote', async () => {
        await syncDeletes(
            [],
            [
                {
                    tableName: 'some-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-1',
                            synchronizedWith: [],
                        },
                    ],
                },
                {
                    tableName: 'another-table-name',
                    deletes: [
                        {
                            cuid: 'cuid-2',
                            synchronizedWith: [],
                        },
                        {
                            cuid: 'cuid-3',
                            synchronizedWith: [],
                        },
                    ],
                },
            ],
            deleteLocallylyMock,
            deleteRemotelyMock,
            //  notifyRemoteThatDeletesAreSyncedOnLocalMock,
            //  notifyRemoteThatDeletesAreSyncedOnRemoteMock,
        );

        expect(notifyRemoteThatDeletesAreSyncedOnRemoteMock).toHaveBeenCalledWith('success');
    });
    */

    it('Should throw, if delete synzhronization fails', async () => {
        expect(() => {
            replayDeletes(
                [
                    {
                        tableName: 'another-table-name',
                        deletes: [
                            {
                                cuid: 'cuid-2',
                                synchronizedWith: [],
                            },
                            {
                                cuid: 'cuid-3',
                                synchronizedWith: [],
                            },
                        ],
                    },
                ],
                [],
                deleteLocallylyMock,
                () => {
                    throw new Error('Error deleting remotely');
                },
                //  notifyRemoteThatDeletesAreSyncedOnLocalMock,
                //  notifyRemoteThatDeletesAreSyncedOnRemoteMock,
            );

        }).toThrow('Error deleting remotely');
    });
});