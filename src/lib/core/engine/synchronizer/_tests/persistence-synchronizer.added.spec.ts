import {
    compareArrays,
} from '../synchronize.fn';
import {
    type TDataType,
} from '../synchronizer-state-detector.fn';
import {
    addHash
} from './helpers';

const localClientId: string = 'local-client-id';
const nonImportatLocalClientId: string = 'non-important-local-client-id';

describe.skip('synchronizer [added]', () => {
    it('[TCB1/2] should add a new entity upstream', () => {
        let prevElement: TDataType<string> | undefined;
        const local: TDataType<string>[] = [
            {
                d: 'd',
                cuid: 'd',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                cuid: 'g',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'h',
                cuid: 'h',
                createdBy: localClientId,
            },
        ]
            .map((item) => {
                const element = {
                    ...addHash(item),
                    pcuid: prevElement?.cuid ?? '0',
                };
                prevElement = element;

                return element;
            });

        const server: TDataType<string>[] = [
            {
                d: 'd',
                cuid: 'd',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                cuid: 'g',
                createdBy: nonImportatLocalClientId,
            },
        ]
            .map((item) => {
                const element = {
                    ...addHash(item),
                    pcuid: prevElement?.cuid ?? '0',
                };
                prevElement = element;

                return element;
            });

        const newArray: string[] = [];
        let addUpstream: [TDataType<string> | undefined, number] = [undefined, -1];
        for (const item of compareArrays(local, server, localClientId, (
            atIndex: number,
            element: TDataType<string>,
        ) => {
            addUpstream = [element, atIndex];
        })) {
            newArray.push(item.d);
        }

        expect(addUpstream).toEqual([
            local[4],
            4,
        ]);

        expect(newArray).toEqual([
            'd',
            'e',
            'f',
            'g',
            'h',
        ]);
    });

    it('[TCB1/2]: should add a new entity downstream', () => {
        let prevElement: TDataType<string> | undefined;
        const local: TDataType<string>[] = [
            {
                d: 'd',
                cuid: 'd',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                cuid: 'g',
                createdBy: nonImportatLocalClientId,
            },
        ]
            .map((item) => {
                const element = {
                    ...addHash(item),
                    pcuid: prevElement?.cuid ?? '0',
                };
                prevElement = element;

                return element;
            });

        const server: TDataType<string>[] = [
            {
                d: 'd',
                cuid: 'd',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                cuid: 'g',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'h',
                cuid: 'h',
                createdBy: nonImportatLocalClientId,
            },
        ]
            .map((item) => {
                const element = {
                    ...addHash(item),
                    pcuid: prevElement?.cuid ?? '0',
                };
                prevElement = element;

                return element;
            });

        const newArray: string[] = [];
        for (const item of compareArrays(local, server, localClientId, (
            atIndex: number,
            element: TDataType<string>,
        ) => {

        })) {
            newArray.push(item.d);
        }

        expect(newArray).toEqual([
            'd',
            'e',
            'f',
            'g',
            'h',
        ]);
    });
    
    it('[TCB3]: should add a new entity upstream, then downstream', () => {
        let prevElement: TDataType<string> | undefined;
        const local: TDataType<string>[] = [
            {
                d: 'd',
                cuid: 'd',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                cuid: 'g',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'h',
                cuid: 'h',
                createdBy: localClientId,
            },
        ]
            .map((item) => {
                const element = {
                    ...addHash(item),
                    pcuid: prevElement?.cuid ?? '0',
                };
                prevElement = element;

                return element;
            });

        const server: TDataType<string>[] = [
            {
                d: 'd',
                cuid: 'd',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                cuid: 'g',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'i',     // <-- But this is also added
                cuid: 'i',
                createdBy: nonImportatLocalClientId,
            },
        ]
            .map((item) => {
                const element = {
                    ...addHash(item),
                    pcuid: prevElement?.cuid ?? '0',
                };
                prevElement = element;

                return element;
            });

        const expected: string[] = [
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
        ];

        for (const _item of compareArrays(local, server, localClientId, (
            atIndex: number,
            element: TDataType<string>,
        ) => {
            server.splice(atIndex, 0, element);
        })) { }

        expect(server.map((e: TDataType<string>) => e.d)).toEqual(expected);
    });
});