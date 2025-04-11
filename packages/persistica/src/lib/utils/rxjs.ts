import { filter, type Observable } from "rxjs";

/**
 * Filters off NULL and undefined, and provides type safety of type T.
 *
 * @returns { (source$: Observable<null | undefined | T>) => Observable<T> }
 */
export function filterNil<T>() {
    return (source$: Observable<null | undefined | T>): Observable<T> =>
        source$.pipe(
            filter((input: null | undefined | T): input is T =>
                (input !== null) && (input !== undefined),
            ),
        );
}
