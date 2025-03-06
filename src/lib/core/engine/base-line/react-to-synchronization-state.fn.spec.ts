
import { it, describe, expect, vi } from 'vitest'
import { reactToSynchronizationStateChange } from './react-to-synchronization-state.fn'
import type { TSynchronizerState } from '../synchronizer/synchronizer';
import { beforeEach } from 'node:test';

describe('reactToSynchronizationState', () => {

    const updateDeletes = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks()
    });

    describe('synchronizing-deletes', () => {
        let innerFn: (
            synchronizerState: TSynchronizerState,
        ) => Promise<void> | undefined;

        it('should update delete tracking lists after synchronizing deletes', async () => {
            const onUpdateState = (
                fn: (
                    synchronizerState: TSynchronizerState,
                ) => Promise<void>,
            ): void => {
                innerFn = fn;
            };

            reactToSynchronizationStateChange(
                'ci-remote-client-id',
                [
                    {

                        tableName: 'table-name',
                        deletes: [
                            {
                                cuid: 'cuid',
                                synchronizedWith: [
                                    'ci-another-remote-client-id',
                                ],
                            }
                        ],
                    }
                ],
                onUpdateState,
                (

                ) => Promise.resolve([
                    // KnownPeers
                    'ci-remote-client-id',
                    'ci-another-remote-client-id',
                ]),
                updateDeletes,
            );

            await innerFn('waiting-for-readyness');
            await innerFn('synchronizing-deletes');
            await innerFn('checking-store-states');

            expect(updateDeletes).toHaveBeenCalledWith([]);
        });

        it('should remove elements that are synchronized with all known peers', async () => {
            const onUpdateState = (
                fn: (
                    synchronizerState: TSynchronizerState,
                ) => Promise<void>,
            ): void => {
                innerFn = fn;
            };

            reactToSynchronizationStateChange(
                'ci-remote-client-id',
                [
                    {
                        tableName: 'table-name',
                        deletes: [
                            {
                                cuid: 'cuid',
                                synchronizedWith: [],
                            }
                        ],
                    }
                ],
                onUpdateState,
                (

                ) => Promise.resolve([
                    'ci-remote-client-id',
                    'ci-another-remote-client-id',
                ]),
                updateDeletes,
            );

            await innerFn('synchronizing-deletes');
            await innerFn('checking-store-states');

            expect(updateDeletes).toHaveBeenCalledWith([{
                tableName: 'table-name',
                deletes: [{
                    cuid: 'cuid',
                    synchronizedWith: [
                        'ci-remote-client-id',
                    ],
                }],
            }]);
        });
    });
});