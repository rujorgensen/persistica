import { generateClientId, generateNetworkId, validateClientId, validateNetworkId } from './core/engine/network/_helpers/network.fn';
import type { INetworkState, TClientId, TNetworkId } from './core/engine/network/network.interfaces';
import type { Observable } from 'rxjs';
import { IndexedDBNetworkStore } from './core/engine/stores/indexeddb/indexeddb-network.store';

const PERSISTICA_KEY_PREFIX = 'persistica-';

export interface IPersisticaWorkspace {
    networkKey?: string; // Optional key
    networkId: TNetworkId; // Unique network ID
    clientId: TClientId; // The local ID (this is local to the device, and will be the same on all workspaces.
    version: number; // Version of the workspace
}

const validateWorkspaceConfiguration = (
    possibleWorkspace: unknown,
): possibleWorkspace is IPersisticaWorkspace => {
    return typeof possibleWorkspace === 'object' &&
        (
            ('networkKey' in possibleWorkspace) ?
                typeof (possibleWorkspace as IPersisticaWorkspace).networkKey === 'string'
                :
                true
        ) &&
        (('networkId' in possibleWorkspace) && validateNetworkId(possibleWorkspace.networkId)) &&
        (('clientId' in possibleWorkspace) && validateClientId(possibleWorkspace.clientId)) &&
        (typeof (possibleWorkspace as IPersisticaWorkspace).version === 'number')
        ;
}

export class Persistica extends IndexedDBNetworkStore {

    public getNetworkStore(
        networkId: TNetworkId,
    ): CurrentNetworkStore {
        return new CurrentNetworkStore(
            this,
            networkId,
        );
    }

    /**
     * Use https://github.com/fingerprintjs/fingerprintjs??
     * @returns 
     */
    public readOrGenerateClientId(

    ): TClientId {
        const possibleClientId: string | null = localStorage.getItem(`${PERSISTICA_KEY_PREFIX}client-id`);

        if (validateClientId(possibleClientId)) {
            return possibleClientId;
        }

        return generateClientId();
    }

    public readLocalWorkspaces(
        options?: {
            // Throw an error, if any stored workspace is invalid
            throwOnInvalidWorkspaces?: boolean;
        },
    ): IPersisticaWorkspace[] {
        const storedWorkspaces: string | null = localStorage.getItem(`${PERSISTICA_KEY_PREFIX}workspaces`);

        // No workspaces
        if (
            (storedWorkspaces === null) ||
            (storedWorkspaces === '')
        ) {
            return [];
        }

        try {
            const possibleWorkspaces: unknown = JSON.parse(storedWorkspaces);

            // Must be an object
            if (typeof possibleWorkspaces !== 'object') {
                throw new Error('Failed to read workspaces. Expected object.');
            }

            // Must be array
            if (!Array.isArray(possibleWorkspaces)) {
                throw new Error('Failed to read workspaces. Expected an array.');
            }

            // Validate each element
            if (options.throwOnInvalidWorkspaces) {
                if (!possibleWorkspaces.every(validateWorkspaceConfiguration)) {
                    throw new Error('Failed to read workspaces. Invalid workspace configuration.');
                }
            } else {
                for (const possibleWorkspace of possibleWorkspaces) {
                    if (!validateWorkspaceConfiguration(possibleWorkspace)) {
                        console.error(`Workspace does not validate: "${possibleWorkspace.networkId}". The workspace will not be included in the list of results.`);
                    }
                }
            }

            return possibleWorkspaces.filter(validateWorkspaceConfiguration);
        } catch (error) {
            throw new Error('Failed to read workspaces. Could not parse stored workspaces.');
        }
    }

    /**
     * Creates a new workspace.
     * 
     * @param { string }    networkKey
     * 
     * @returns { INetworkState }
     */
    public createWorkspace(
        networkKey?: string,
    ): INetworkState {
        return {
            networkId: generateNetworkId(),
            networkKey: networkKey,
            clientId: this.readOrGenerateClientId(),
            version: 1,
            knownPeers: [],
            deletes: [],
        };
    }

    /**
     * Join a workspace that already exists, but has not already been used on this device.
     * 
     * @param { TNetworkId }    networkId
     * @param { string }        [networkKey]
     * 
     * @returns { IPersisticaWorkspace }
     */
    public joinExistingWorkspace(
        networkId: TNetworkId,
        networkKey?: string
    ): IPersisticaWorkspace {

        if (
            this.readLocalWorkspaces({
                throwOnInvalidWorkspaces: false,
            }).find((ws: IPersisticaWorkspace): boolean => ws.networkId === networkId)
        ) {
            throw new Error('The workspace already exists on this device.');
        }

        return {
            networkId: networkId,
            networkKey: networkKey,
            clientId: this.readOrGenerateClientId(),
            version: 1,
        };
    }
}
export class CurrentNetworkStore {

    constructor(
        private readonly _networkStore: Persistica,
        private readonly _networkId: TNetworkId,
    ) { }

    public onUpdate$$(

    ): Observable<INetworkState> {
        return this._networkStore
            .onUpdate(
                this._networkId,
            );
    }

    public update(
        networkState: INetworkState,
    ): void {
        this._networkStore.update(
            networkState,
        );
    }
}
