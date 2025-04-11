// Check env
// const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;

globalThis.count ??= 0;
globalThis.count++;

console.log(`Reloaded ${globalThis.count} time(s)`);

import type { TCallback2, TClientOwnUId, TNetworkId_S } from '@flux/shared';
import { FluxNetworkConnection } from './flux-network.class';
import {
    type TNetworkConnectionState,
    createWSConnection,
    FluxWebSocketConnection,
} from './connector/flux-ws-connection';
import { nanoid } from 'nanoid';
import { BehaviorSubject } from 'rxjs';
import { TRTCState } from './connector/low-level-com/web-rtc/ice-connection';
import { authenticateOrThrow } from './connector/auth/register-client.auth';
import { authenticateNetworkAuthorityOrThrow, RetryableError } from './connector/auth/register-authority.auth';
import { FluxClientData } from './connector/flux-client-data.class';
import { TChannnelAuthCallback } from './channel/channel.type';
import { retry } from './utils/promises.utils';
import { TAuthorizeCallback } from 'apps/flux/shared/src/lib/auth/auth.fn';


export class FluxAgent {

    public readonly id: string = nanoid();

    // Switch this to CB style for lightweightness
    public readonly networkState$$: BehaviorSubject<TNetworkConnectionState> = new BehaviorSubject<TNetworkConnectionState>('disconnected');

    private readonly webRTCConnectionState$$: BehaviorSubject<TRTCState> = new BehaviorSubject<TRTCState>('idle');

    private fluxWebSocketConnection: FluxWebSocketConnection | undefined;
    private readonly fluxClientData: FluxClientData = new FluxClientData();

    // Has the client preivously connected to the network or registered as an authority?
    // ! TODO  MOVE 
    private readonly previousNetworkActions: {
        networkConnection: {
            identification: unknown,
            clientUUIDToken?: string,
        } | null;
        registerAuthority: {
            authorityKey: string,
            cb: (...args: any) => Promise<string>;
            authorizeNetworkChannel: TChannnelAuthCallback<any>,
        } | null;
    } = {
            networkConnection: null,
            registerAuthority: null,
        };

    constructor(
        private readonly networkId: TNetworkId_S,
        private readonly options?: {
            domain?: string,
            secretKey?: string; // For encrypting/decrypting packages. Not known to Flux.
            retries?: number; // Number of times to retry a failed message
        },
    ) { }

    /**
     *
     * @param { unknown }   identification
     * @param { string }    [clientUUIDToken]
     *
     * @returns { Promise<FluxNetworkConnection> }
     */
    public async connect(
        identification: unknown,
        clientUUIDToken?: string,
    ): Promise<FluxNetworkConnection> {
        this.previousNetworkActions.networkConnection = {
            identification,
            clientUUIDToken: clientUUIDToken,
        };

        this.networkState$$.next('authorizing');

        const ticket = await authenticateOrThrow(
            this.networkId,
            this.options?.domain ?? 'http://localhost:8080',
            identification,
        );

        this.fluxWebSocketConnection = createWSConnection(
            this.id,
            ticket,
            this.webRTCConnectionState$$,
            this.registerAuthority.bind(this),
            this.connect.bind(this),
            this.options,
        );

        this.fluxClientData.updateWsConnection(this.fluxWebSocketConnection);

        this.fluxWebSocketConnection
            .networkState$$
            .subscribe((nst) => {
                this.networkState$$.next(nst);
            });

        const fluxNetworkConnection: FluxNetworkConnection = await this
            .fluxWebSocketConnection
            .connectToNetwork(
                clientUUIDToken as TClientOwnUId,
            );

        return fluxNetworkConnection;
    }

    /**
     *
     * @param { string }                    authorityKey
     * @param { TAuthorizeCallback }        authorizeNetworkClient
     * @param { TChannnelAuthCallback }     authorizeNetworkChannel
     *
     * @returns { Promise<void> }
     */
    public async registerAuthority<T, M>(
        authorityKey: string,
        authorizeNetworkClient: TAuthorizeCallback<T>,
        authorizeNetworkChannel: TChannnelAuthCallback<M>,
    ): Promise<FluxNetworkConnection> {
        this.previousNetworkActions.registerAuthority = {
            authorityKey,
            cb: authorizeNetworkClient,
            authorizeNetworkChannel,
        };

        this.networkState$$.next('authorizing');

        const ticket: string = await retry<any>(
            () => authenticateNetworkAuthorityOrThrow(
                this.networkId,
                this.options?.domain ?? 'http://localhost:8080',
                authorityKey,
            ),
            (err: unknown) => err instanceof RetryableError,
            {
                retries: 10_000,
                delayMs: 500,
            },
        );

        this.fluxWebSocketConnection = createWSConnection(
            this.id,
            ticket,
            this.webRTCConnectionState$$,
            this.registerAuthority.bind(this),
            this.connect.bind(this),
            this.options,
        );

        this.fluxClientData.updateWsConnection(this.fluxWebSocketConnection);

        this.fluxWebSocketConnection
            .networkState$$
            .subscribe((nst) => {
                this.networkState$$.next(nst);
            });

        return this
            .fluxWebSocketConnection
            .registerAuthority(
                authorizeNetworkClient,
                authorizeNetworkChannel,
            );
    }

    /**
     *
     * @param fn
     *
     * @returns { void }
     */
    public onWebRTConnectionState(
        fn: (
            webRTCConncetionState: TRTCState,
        ) => void,
    ): void {
        this.webRTCConnectionState$$
            .subscribe({
                next: fn,
            });
    }

    /**
     *
     * @param fn
     *
     * @returns { void }
     */
    public onNetworkState(
        fn: (
            networkState: TNetworkConnectionState,
        ) => void,
    ): void {
        this.networkState$$
            .subscribe({
                next: fn,
            });
    }

    public onMessage(
        cb: TCallback2,
    ): void {
        this.fluxClientData.onMessage(cb);
    }
}
