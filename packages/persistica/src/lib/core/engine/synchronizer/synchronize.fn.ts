
import {
    type TDataType,
    type TSyncState,
    detectState,
} from './synchronizer-state-detector.fn';

export function* compareArrays(
    localData: TDataType<string>[],
    serverData: TDataType<string>[],
    clientId: string,
    pushToUpstream: (
        atIndex: number,
        element: TDataType<string>,
    ) => void,
): Generator<TDataType<string>> {

    let i = 0;
    while (true) {

        if ((localData[i] === undefined) && (serverData[i] === undefined)) {
            break;
        }

        const localDataElement = localData[i];

        if (localDataElement && (localDataElement?.hash === serverData[i]?.hash)) {
            // const {
            //     createdBy,
            //     ...rest
            // } = localDataElement as TDataType<string>;

            yield localDataElement;
        } else {
            yield synchronize<string>(
                i,
                'keyeyyeye' as any,
                clientId,
            )(
                localDataElement,
                serverData[i],
                pushToUpstream,
            );
        }

        i++;
        if (i === 1000) {
            break;
        }
    }
};

export const synchronize = <T>(
    index: number,
    idKeyName: keyof Omit<TDataType<T>, 'editedBy'>,
    clientId: string,
): (
    localData: TDataType<T> | undefined,
    serverData: TDataType<T> | undefined,
    pushToUpstream: (
        atIndex: number,
        element: TDataType<T>,
    ) => void,
) => TDataType<T> => {

    /**
     * Returns the element as it should look at that specific index.
     * 
     * @param index 
     * 
     * @returns { TDataType<T> }
     */
    return (
        localData: TDataType<T> | undefined,
        serverData: TDataType<T> | undefined,
        pushUpstream: (
            atIndex: number,
            element: TDataType<T>,
        ) => void,
    ): TDataType<T> => {

        if ((localData === undefined) && (serverData === undefined)) {
            throw new Error('Unexpected');
        }

        const state: TSyncState = detectState(
            localData,
            serverData,
            idKeyName,
            clientId,
        );

        switch (state) {
            case 'in-sync':
                break;

            case 'created-locally':

                if (localData) {
                    pushUpstream(index, localData);
                    return localData;
                }

                break;

            case 'created-elsewhere':
                break;

            case 'edited-locally':
                if (!localData) {
                    throw new Error('No local data');
                }
                // TC3
                return localData;

            case 'edited-elsewhere':
                break;

            case 'edited-both':
                // TC2
                throw new Error('Needs user intervention');

        }

        if (serverData) {
            return serverData;
        }

        throw new Error(`Unexpected: ${state}`);
    };
};