import { IDeleted } from '../network.interfaces';
import { syncDeletes } from './helpers.fn';

describe('syncDeletes', () => {
    it('should combine the lists', () => {
        const synchronizedDeletes: IDeleted[] = syncDeletes(
            'ci-clientA',
            'ci-clientB',
            // Client A
            [
                {
                    cuid: 'cuid_dsadsa',
                    synchronizedWith: [
                        'ci-clientT'
                    ],
                }
            ],

            // Client B
            [
                {
                    cuid: 'cuid_123',
                    synchronizedWith: [
                        'ci-clientB'
                    ],
                }
            ],
        );


        const expectedDeletes: IDeleted[] = [
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
        ];

        expect(synchronizedDeletes).toStrictEqual(expectedDeletes);
    });
});