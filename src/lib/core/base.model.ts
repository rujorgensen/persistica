import {
    type Observable,
    from,
    switchMap,
} from 'rxjs';
import { filterFunction, type TSearchCriteriaType } from './data-types/filter.interfaces.js';
import { type IChangeSource, replayAndUpdate$, replayAndUpdateSingle$ } from './engine/change-event.util.js';
import type { PersistenceWrapper } from './engine/persistence.wrapper.js';
import type { TUniqueIdentifier } from './engine/_types/element.type.js';
import { convertFromCallbackToEventSource } from './_utils/cb-to-event-source.js';

export class BaseModel<TTableName extends string, ReturnType> {

    private readonly eventSource: IChangeSource<ReturnType>;

    constructor(
        private readonly idkn: keyof ReturnType,
        private readonly modelName: TTableName,
        private readonly store: PersistenceWrapper,
    ) {
        this.eventSource = convertFromCallbackToEventSource<ReturnType>(this.modelName, store);
    }

    // ******************************************************************************
    // *** CREATE
    // ******************************************************************************
    public create(
        object_: ReturnType | ReturnType[],
    ): Promise<ReturnType | ReadonlyArray<ReturnType>> {
        return this.store.create<ReturnType>(
            this.modelName,
            object_,
        );
    };

    // ******************************************************************************
    // *** READ
    // ******************************************************************************
    public read$$(id: TUniqueIdentifier): Observable<ReturnType | undefined>;
    public read$$(criteria: TSearchCriteriaType<ReturnType>): Observable<ReadonlyArray<ReturnType>>;
    public read$$(
        criteriaOrId: TUniqueIdentifier | TSearchCriteriaType<ReturnType>,
    ): Observable<ReturnType | undefined> | Observable<ReadonlyArray<ReturnType>> {

        if (
            (typeof criteriaOrId === 'string') ||
            (typeof criteriaOrId === 'number')
        ) {
            return from(this.store.read<ReturnType>(
                this.modelName,
                criteriaOrId,
            ))
                .pipe(
                    switchMap((e: ReturnType | undefined) =>
                        replayAndUpdateSingle$<ReturnType>(
                            this.idkn,
                            criteriaOrId,
                            e,
                            this.eventSource,
                        ),
                    ),
                );
        }

        return from(this.store.readMany<ReturnType>(this.modelName))
            .pipe(
                switchMap((e: ReadonlyArray<ReturnType>) => {
                    return replayAndUpdate$<ReturnType>(
                        this.idkn,
                        e,
                        this.eventSource,
                        filterFunction<ReturnType>(criteriaOrId),
                    );
                }),
            );
    }

    // ******************************************************************************
    // *** UPDATE
    // ******************************************************************************
    public update(
        object_: ReturnType | ReadonlyArray<ReturnType>,
    ): Promise<ReturnType | ReadonlyArray<ReturnType>> {
        return this.store.update(this.modelName, object_);
    };

    // ******************************************************************************
    // *** DELETE
    // ******************************************************************************
    public delete(
        object_: TUniqueIdentifier | TUniqueIdentifier[],
    ): Promise<ReturnType | undefined | ReadonlyArray<ReturnType>> {
        return this.store.delete(this.modelName, object_);
    }
}