export const Id = () => ({ type: 'string', id: true, } as const);
export const Text = {
    nonEmpty: () => ({ type: 'string' } as const),
};

export const TrueOrFalse = {
    optional: () => ({
        type: 'boolean',
        optional: true,

        // Functions
        default: (
            defaultValue: boolean | (() => boolean) = false
        ) => ({
            type: 'boolean',
            optional: true,
            useDefault: true,
        }) as const,
    } as const),
};

export const DateTime = {
    optional: () => ({
        type: 'date',
        optional: true,
    } as const),
};