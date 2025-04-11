import type {
    IBooleanSearchCriteria,
    IDateSearchCriteria,
    INumberSearchCriteria,
    IStringSearchCriteria,
} from './filter.interfaces';


// ******************************************************************************
// *** Criteria filters
// ******************************************************************************

export const filterString = (
    searchCriteria: IStringSearchCriteria,
    element: string,
): boolean => {
    /*
        export interface IStringSearchCriteria {
            START_WITH?: string;
            END_WITH?: string;
            CONTAINS?: string;
            IGNORE_CASE?: boolean;
        }
    */
    if (searchCriteria.IGNORE_CASE !== undefined) {
        element = element.toLowerCase();
        searchCriteria.START_WITH = searchCriteria.START_WITH?.toLowerCase();
        searchCriteria.END_WITH = searchCriteria.END_WITH?.toLowerCase();
        searchCriteria.CONTAINS = searchCriteria.CONTAINS?.toLowerCase();
    }

    if (searchCriteria.START_WITH !== undefined) {
        if (!element.startsWith(searchCriteria.START_WITH)) {
            return false;
        }
    }

    if (searchCriteria.END_WITH !== undefined) {
        if (!element.endsWith(searchCriteria.END_WITH)) {
            return false;
        }
    }
    if (searchCriteria.CONTAINS !== undefined) {
        if (!element.includes(searchCriteria.CONTAINS)) {
            return false;
        }
    }

    return true;
};

export const filterDate = (
    searchCriteria: IDateSearchCriteria,
    element: Date,
): boolean => {
    if (searchCriteria?.BETWEEN) {
        return element >= searchCriteria.BETWEEN[0] && element <= searchCriteria.BETWEEN[1];
    }
    if (searchCriteria?.AFTER) {
        return element >= searchCriteria.AFTER;
    }
    if (searchCriteria?.BEFORE) {
        return element <= searchCriteria.BEFORE;
    }

    return false;
};

export const filterNumber = (
    searchCriteria: INumberSearchCriteria,
    element: number,
): boolean => {
    /*
        BETWEEN?: [number, number];
    HIGHER_THAN?: number;
    LOWER_THAN?: number;
    */

    throw new Error('filterNumber is not implemented');
};

export const filterBoolean = (
    searchCriteria: IBooleanSearchCriteria,
    element: boolean,
): boolean => {
    return searchCriteria.STATE === !!element;
};