/**
 * @VERSION
 *                  0.1.0
 *
 * @CREATOR
 *                  Rune (rj) - rj@oxyguard.dk
 *
 * @DESCRIPTION
 *                  ...
 */
import {
    type Observable,
    filter,
    map,
    merge,
    startWith,
    distinctUntilChanged,
    NEVER,
} from 'rxjs';
import { TUniqueIdentifier } from './_types/element.type';

export interface IChangeSource<T> {
    onCreate$$: Observable<T | ReadonlyArray<T>>,
    onUpdate$$: Observable<T | ReadonlyArray<T>>,
    onDelete$$: Observable<T | ReadonlyArray<T>>,
};

export function replayAndUpdate$<T>(
    idkn: keyof T,

    originalList: ReadonlyArray<T>,

    // Emits when this user itself modifies state
    internalSource: IChangeSource<T>,

    // Optional filter function for when Ts are created or updated (they might not be required in the list)
    filterNewOrUpdatedFn?: (
        obj: T,
    ) => boolean,
): Observable<ReadonlyArray<T>> {
    let cache: T[] = structuredClone([...originalList]);

    return merge(

        // ******************************************************************************
        // *** CREATE
        // ******************************************************************************
        internalSource.onCreate$$
            .pipe(
                map(v => (Array.isArray(v) ? v : [v]) as ReadonlyArray<T>),

                map((createdList: ReadonlyArray<T>): boolean => {
                    let anyChange: boolean = false;

                    for (const created of createdList) {
                        if (!filterNewOrUpdatedFn || filterNewOrUpdatedFn(created)) {
                         
                            const existingElementIndex: number = cache.findIndex((el: T): boolean =>
                                created[idkn] === el[idkn],
                            );
                            if (existingElementIndex > -1) {
                                cache[existingElementIndex] = created;
                                cache = [...cache];
                            } else {
                                cache = [...cache, created];
                            }

                        } else {
                            console.warn(`Element was not added: "${JSON.stringify(created)}"`);
                        }

                        anyChange = true;
                    }

                    return anyChange;
                }),
            ),

        // ******************************************************************************
        // *** UPDATE
        // ******************************************************************************
        internalSource.onUpdate$$
            .pipe(
                map(v => (Array.isArray(v) ? v : [v]) as ReadonlyArray<T>),

                map((incommingElements: ReadonlyArray<T>): boolean => {
                    let anyUpdated: boolean = false;

                    for (const incommingElement of incommingElements) {
                        const [ret, list] = onUpdate(idkn, cache, filterNewOrUpdatedFn)(incommingElement);

                        if (ret) {
                            cache = list;
                            anyUpdated = true;
                        }
                    }

                    return anyUpdated;
                }),
            ),

        // ******************************************************************************
        // *** DELETE
        // ******************************************************************************
        internalSource.onDelete$$
            .pipe(
                map(v => (Array.isArray(v) ? v : [v]) as ReadonlyArray<T>),
                map((deletedElements: ReadonlyArray<T>): boolean => {
                    let anyDeleted: boolean = false;

                    for (const deletedElement of deletedElements) {
                        const currentIndex: number = cache.findIndex((c: T) => c[idkn] === deletedElement[idkn]);

                        if (currentIndex > -1) {
                            cache.splice(currentIndex, 1);
                            anyDeleted = true;
                        }
                    }

                    if (anyDeleted) {
                        cache = [...cache];
                    }

                    return anyDeleted;
                }),

            ),
    )
        .pipe(
            filter((shouldEmit: boolean): boolean => shouldEmit),
            map(() => cache),
            startWith(cache),
            // Don't emit same lists
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        )
        ;
}

export function replayAndUpdateSingle$<T>(
    idkn: keyof T,
    cuid: TUniqueIdentifier,
    original: T | undefined,

    // Emits when this user itself modifies state
    internalSource: IChangeSource<T>,
): Observable<T | undefined> {
    let cache: T | undefined = structuredClone(original);

    return merge(
        // ******************************************************************************
        // *** CREATE - only watched if the initial value is undefined
        // ******************************************************************************
        original ?
            NEVER
            :
            internalSource.onCreate$$
                .pipe(
                    map(v => (Array.isArray(v) ? v : [v]) as ReadonlyArray<T>),

                    map((createdList: ReadonlyArray<T>): boolean => {
                        const findCreated: T | undefined = createdList.find((c: T) => c[idkn] === cuid);

                        if (!findCreated) {
                            return false;
                        }

                        cache = findCreated;
                        return true;
                    }),
                ),

        // ******************************************************************************
        // *** UPDATE
        // ******************************************************************************
        internalSource.onUpdate$$
            .pipe(
                map(v => (Array.isArray(v) ? v : [v]) as ReadonlyArray<T>),

                map((updatedList: ReadonlyArray<T>): boolean => {
                    const findUpdated: T | undefined = updatedList.find((c: T) => c[idkn] === cuid);

                    if (!findUpdated) {
                        return false;
                    }

                    cache = findUpdated;
                    return true;
                }),
            ),

        // ******************************************************************************
        // *** DELETE
        // ******************************************************************************
        internalSource.onDelete$$
            .pipe(
                map(v => (Array.isArray(v) ? v : [v]) as ReadonlyArray<T>),
                map((deletedList: ReadonlyArray<T>): boolean => {
                    const findUpdated: T | undefined = deletedList.find((c: T) => c[idkn] === cuid);

                    if (!findUpdated) {
                        return false;
                    }

                    // !NB This is a delete, so delete the element and mark for update
                    cache = undefined;

                    return true;
                }),
            ),
    )
        .pipe(
            filter((shouldEmit: boolean): boolean => shouldEmit),
            map(() => cache),
            startWith(cache),
            // Don't emit same element twice
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        );
}

const onUpdate = <T>(
    idkn: keyof T,
    cache: T[],
    filterNewOrUpdatedFn?: (
        obj: T
    ) => boolean,
) => {
    return (
        updated: T,
    ): [boolean, T[]] => {
        const existingElementIndex: number = cache.findIndex((el: T): boolean =>
            updated[idkn] === el[idkn],
        );

        if (filterNewOrUpdatedFn && !filterNewOrUpdatedFn(updated)) {
            if (existingElementIndex > -1) {
                console.log(`Element is out of range, removing instead: "${JSON.stringify(updated)}"`);
                cache.splice(existingElementIndex, 1);

                return [true, [...cache]];
            } else {
                // Just return
                return [false, [...cache]];
            }
        }

        if (existingElementIndex > -1) {
            console.log(`Updating element: "${JSON.stringify(updated)}"`);
            cache[existingElementIndex] = updated;

            return [true, [...cache]];
        } else {
            // Add it to the list if not existing
            cache = [...cache, updated];

            return [true, [...cache]];
        }
    };
};
