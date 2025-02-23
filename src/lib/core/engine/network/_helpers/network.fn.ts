import { nanoid } from 'nanoid';
import type { TClientId, TNetworkId } from '../network.interfaces';

export const generateNetworkId = (

): TNetworkId => {
    return `ni-${nanoid()}`;
};

/**
 * 
 * Use https://github.com/fingerprintjs/fingerprintjs?? 
 * 
 * @returns { TClientId } 
 */
export const generateClientId = (

): TClientId => {
    return `ci-${nanoid()}`;
};

export const validateClientId = (
    possibleClientId: unknown,
): possibleClientId is TClientId => {
    return typeof possibleClientId === 'string' &&
        possibleClientId.startsWith('ci-') &&
        (possibleClientId.length > 3)
        ;
};

export const validateNetworkId = (
    possibleClientId: unknown,
): possibleClientId is TClientId => {
    return typeof possibleClientId === 'string' &&
        possibleClientId.startsWith('ni-') &&
        (possibleClientId.length > 3)
        ;
};