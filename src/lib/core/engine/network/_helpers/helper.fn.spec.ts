import { expect, describe, it } from 'vitest';
import type { ITableDeletes } from '../network.interfaces';
import { syncDeleteLists } from './helpers.fn';

describe('syncDeletes', () => {
    it('should combine the lists', () => {
        const synchronizedDeletes: ITableDeletes[] = syncDeleteLists(
            'ci-clientA',
            'ci-clientB',
            // Client A
            [
                {
                    tableName: 'some-table-name',
                    deletes: [
                        {
                            cuid: 'cuid_dsadsa',
                            synchronizedWith: [
                                'ci-clientT'
                            ],
                        }
                    ]
                },
            ],

            // Client B
            [
                {
                    tableName: 'some-table-name',
                    deletes: [{
                        cuid: 'cuid_123',
                        synchronizedWith: [
                            'ci-clientB'
                        ],
                    }]
                },
            ],
        );

        const expectedDeletes: ITableDeletes[] = [
            {
                tableName: 'some-table-name',
                deletes: [
                    {
                        cuid: 'cuid_123',
                        synchronizedWith: [
                            'ci-clientA',
                            'ci-clientB',
                        ],
                    },

                    {
                        cuid: 'cuid_dsadsa',
                        synchronizedWith: [
                            'ci-clientA',
                            'ci-clientB',
                            'ci-clientT',
                        ],
                    },
                ],
            },
        ];

        expect(synchronizedDeletes).toStrictEqual(expectedDeletes);
    });
});