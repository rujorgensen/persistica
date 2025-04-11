import {
    type Observable,
    from,
    switchMap,
    NEVER,
} from 'rxjs';
import { type IChangeSource, replayAndUpdateSingle$ } from './engine/change-event.util.js';
import type { PersistenceWrapper } from './engine/persistence.wrapper.ts';
import { convertFromCallbackToEventSource } from './_utils/cb-to-event-source.js';

export class BaseStore<TTableName extends string, ReturnType> {

    private readonly eventSource: IChangeSource<ReturnType & { _cuid: string; }>;

    constructor(
        private readonly storeName: TTableName,
        private readonly store: PersistenceWrapper,
    ) {
        this.eventSource = {
            ...convertFromCallbackToEventSource<ReturnType & { _cuid: string; }>(this.storeName, this.store),
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