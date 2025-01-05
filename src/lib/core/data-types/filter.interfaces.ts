import {
    filterBoolean,
    filterDate,
    filterNumber,
    filterString,
} from './filter.utils';
import { OneOfType } from './one-of-type';

// ******************************************************************************
// *** Criterias
// ******************************************************************************

export interface IStringSearchCriteria {
    START_WITH?: string;
    END_WITH?: string;
    CONTAINS?: string;
    IGNORE_CASE?: boolean;
}

export type IDateSearchCriteria = OneOfType<{
    BETWEEN?: [Date, Date];
    AFTER?: Date;
    BEFORE?: Date;
}>;

export interface INumberSearchCriteria {
    BETWEEN?: [number, number];
    HIGHER_THAN?: number;
    LOWER_THAN?: number;
}
export interface IBooleanSearchCriteria {
    STATE: boolean;
}

export type TSearchCriteriaType<T> = {
    [K in keyof T]?: (
        T[K] extends Date ? IDateSearchCriteria :
        (T[K] extends string ? IStringSearchCriteria :
            (T[K] extends number ? INumberSearchCriteria :
                (T[K] extends boolean ? IBooleanSearchCriteria : never)
            )
        )
    )
    ;
};

// Derived type where Date is converted to string
export type TDateAsString<T> = {
    [K in keyof T]: T[K] extends Date ? string : T[K];
};

/**
 * 
 * @param filterCriteria
 * 
 * @returns { Function }
 */
export const filterFunction = <T>(
    filterCriteria: TSearchCriteriaType<T>
): (element: T) => boolean => {

    if (
        (Object.keys(filterCriteria).length === 0)
    ) {
        return (_element: T): boolean => true;
    }

    return (
        element: T,
    ): boolean => {

        if (!element || (typeof element !== 'object')) {
            throw new TypeError('The element does not have keys');
        }

        for (const [testCriteriaKey, value] of Object.entries(filterCriteria)) {
            const element_: unknown = element[(testCriteriaKey as keyof T)];

            if (!element_) {
                continue;
            }

            switch (typeof element_) {
                case 'string':
                    return filterString(
                        value as IStringSearchCriteria,
                        element_,
                    );
                case 'number':
                    return filterNumber(
                        value as INumberSearchCriteria,
                        element_,
                    );
                case 'boolean':
                    return filterBoolean(
                        value as IBooleanSearchCriteria,
                        element_,
                    );
                case 'object':
                    if (element_.constructor === Date) {
                        return filterDate(
                            value as IDateSearchCriteria,
                            element_,
                        );
                    }
                    break;
            }
        }

        throw new Error(`Type not matched: ${typeof element}`);
    };
};