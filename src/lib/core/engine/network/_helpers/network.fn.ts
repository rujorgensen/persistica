import { nanoid } from 'nanoid';
import type { TClientId, TNetworkId } from '../network.interfaces';

export const generateNetworkId = (

): TNetworkId => {
    return `ni-${nanoid()}`;
};

export const generateClientId = (

): TClientId => {
    return `ci-${nanoid()}`;
};