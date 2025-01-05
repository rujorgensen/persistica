
import {
    type Observable,
    from,
    bindCallback,
    switchMap,
    NEVER,
} from 'rxjs';
import { IChangeSource, replayAndUpdateSingle$ } from './engine/change-event.util';
import { PersistenceWrapper } from './engine/persistence.wrapper';

export class BaseStore<TTableName extends string, ReturnType> {

    private readonly eventSource: IChangeSource<ReturnType & { _cuid: string; }>;

    constructor(
        private readonly storeName: TTableName,
        private readonly store: PersistenceWrapper,
    ) {
        this.eventSource = {
            onCreate$$: bindCallback(
                (cb: (elements: ReadonlyArray<ReturnType & { _cuid: string; }>) => void): void => this.store.onCreate<TTableName, ReturnType & { _cuid: string; }>(this.storeName, cb)
            )(),
            onUpdate$$: bindCallback(
                (cb: (elements: ReadonlyArray<ReturnType & { _cuid: string; }>) => void): void => this.store.onUpdate<TTableName, ReturnType & { _cuid: string; }>(this.storeName, cb)
            )(),
            onDelete$$: NEVER,
        };
    }

    // ******************************************************************************
    // *** READ
    // ******************************************************************************
    public read$$(

    ): Observable<ReturnType | undefined> {
        return from(this.store.read<ReturnType & { _cuid: string; }>(
            this.storeName,
            `${this.storeName}-0`,
        ))
            .pipe(
                switchMap((e: ReturnType & { _cuid: string; } | undefined) =>
                    replayAndUpdateSingle$<ReturnType & { _cuid: string; }>(
                        '_cuid',
                        `${this.storeName}-0`,
                        e,
                        this.eventSource,
                    ),
                ),
            );
    };

    // ******************************************************************************
    // *** UPDATE
    // ******************************************************************************
    public update(
        object_: ReturnType,
    ): Promise<ReturnType> {
        return this.store.update<ReturnType>(
            this.storeName,
            {
                _cuid: `${this.storeName}-0`,
                ...object_,
            },
        )
            // TODO improve this
            .then((a: any) => {

                return {
                    ...a
                } as unknown as ReturnType; // TODO improve this
            })
            ;
    };

}