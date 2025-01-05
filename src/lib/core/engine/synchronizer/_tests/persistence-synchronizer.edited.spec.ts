import { compareArrays } from "../synchronize.fn";
import { TDataType } from "../synchronizer-state-detector.fn";
import { addHash } from "./helpers";

const localClientId: string = 'local-client-id';
const nonImportatLocalClientId: string = 'non-important-local-client-id';

describe.skip('synchronizer [edited]', () => {
    it.only('TCC2: should error as both are edited', () => {
        let prevElement: TDataType<string> | undefined;
        const local: TDataType<string>[] = [
            {
                d: 'c',
                hash: 'c',
                cuid: 'c',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'j',             // <-- Different data
                hash: 'j',          // <-- Different hash
                cuid: 'd',          // <-- Same cuid
                createdBy: nonImportatLocalClientId,
                editedBy: localClientId,
            },
            {
                d: 'e',
                hash: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                hash: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                hash: 'g',
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
                d: 'c',
                hash: 'c',
                cuid: 'c',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'i',             // <-- Different data
                hash: 'i',          // <-- Different hash
                cuid: 'd',          // <-- Same cuid
                editedBy: nonImportatLocalClientId,
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                hash: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                hash: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                hash: 'g',
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

        expect(() => {
            for (const item of compareArrays(local, server, localClientId, (
                atIndex: number,
                element: TDataType<string>,
            ) => {
            })) { }
        }).toThrow('Needs user intervention');
    });

    it.skip('TCC3: should push edit upstream', () => {
        let prevElement: TDataType<string> | undefined;
        const local: TDataType<string>[] = [
            {
                d: 'c',
                hash: 'c',
                cuid: 'c',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'j',             // <-- Different data
                hash: 'j',          // <-- Different hash
                cuid: 'd',          // <-- Same cuid
                createdBy: nonImportatLocalClientId,
                editedBy: localClientId,
            },
            {
                d: 'e',
                hash: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                hash: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                hash: 'g',
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
                d: 'c',
                hash: 'c',
                cuid: 'c',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'd',             // <-- Old data
                hash: 'd',          // <-- Old hash
                cuid: 'd',          // <-- Same cuid
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                hash: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                hash: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                hash: 'g',
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

        const expected: string[] = [
            'c',
            'j',
            'e',
            'f',
            'g',
        ];

        const newArray: string[] = [];
        for (const item of compareArrays(local, server, localClientId, (
            atIndex: number,
            element: TDataType<string>,
        ) => {
        })) {
            newArray.push(item.d);
        }

        expect(newArray).toEqual(expected);
    });

    it.skip('TCC3: should pull edit downstream', () => {
        let prevElement: TDataType<string> | undefined;
        const local: TDataType<string>[] = [
            {
                d: 'c',
                hash: 'c',
                cuid: 'c',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'd',             // <-- Old data
                hash: 'd',          // <-- Old hash
                cuid: 'd',          // <-- Same cuid
                createdBy: nonImportatLocalClientId,
                edited: true,
            },
            {
                d: 'e',
                hash: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                hash: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                hash: 'g',
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
                d: 'c',
                hash: 'c',
                cuid: 'c',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'j',             // <-- Different data
                hash: 'j',          // <-- Different hash
                cuid: 'd',          // <-- Same cuid
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'e',
                hash: 'e',
                cuid: 'e',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'f',
                hash: 'f',
                cuid: 'f',
                createdBy: nonImportatLocalClientId,
            },
            {
                d: 'g',
                hash: 'g',
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

        const expected: string[] = [
            'c',
            'j',
            'e',
            'f',
            'g',
            'h',
        ];

        const newArray: string[] = [];
        for (const item of compareArrays(local, server, localClientId, (
            atIndex: number,
            element: TDataType<string>,
        ) => {
        })) {
            newArray.push(item.d);
        }

        expect(newArray).toEqual(expected);
    });
});