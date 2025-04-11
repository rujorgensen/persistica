import objectHash from 'object-hash';

export const addHash = <T extends { d: string; cuid: string; }>(
    element: T,
): T & { hash: string; } => {
    return {
        ...element,
        hash: objectHash(element),
    };
};