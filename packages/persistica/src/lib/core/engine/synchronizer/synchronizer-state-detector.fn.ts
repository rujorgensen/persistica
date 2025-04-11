
export type TSyncState =
    'in-sync' |
    'created-locally' |
    'created-elsewhere' |
    'edited-locally' |
    'edited-elsewhere' |
    'edited-both'                 // This needs user intervention
    ;

export type TDataType<T> = {
    d: T;
    hash: string,
    pcuid: string;
    createdBy: string;
    editedBy?: string;
};

export const detectState = <T>(
    localData: TDataType<T> | undefined,
    remoteData: Omit<TDataType<T>, 'editedBy'> | undefined,
    idKeyName: keyof Omit<TDataType<T>, 'editedBy'>,
    localClientId: string,
): TSyncState => {

    if (!localData && !remoteData) {
        throw new Error('At least one value must be defined');
    }

    // TA1
    if (
        (localData?.[idKeyName] === remoteData?.[idKeyName]) &&
        (localData?.hash === remoteData?.hash)) {
        return 'in-sync';
    }

    // TB2
    if (
        (localData?.[idKeyName] === remoteData?.[idKeyName]) &&
        (localData?.createdBy === localClientId) &&
        (
            !remoteData ||
            (remoteData?.createdBy !== localClientId)
        )
    ) {
        return 'created-locally';
    }

    // TB3
    if (
        (
            localData?.[idKeyName] === remoteData?.[idKeyName]
        ) &&
        (localData?.hash !== remoteData?.hash)
    ) {
        return 'created-elsewhere';
    }

    // TC3
    if (
        (localData?.[idKeyName] === remoteData?.[idKeyName]) &&
        (localData?.hash !== remoteData?.hash) &&
        (localData?.editedBy === localClientId)
    ) {
        return 'edited-locally';
    }

    // TC2
    if (
        (localData?.[idKeyName] === remoteData?.[idKeyName]) &&
        (localData?.hash !== remoteData?.hash) &&
        (localData?.editedBy === localClientId)
    ) {
        return 'edited-both';
    }

    if (
        (localData?.[idKeyName] === remoteData?.[idKeyName]) &&
        (localData?.hash !== remoteData?.hash)
    ) {
        return 'edited-elsewhere';
    }

    throw new Error('Unexpected');
};