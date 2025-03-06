import 'fake-indexeddb/auto';
import { WebSocket, WebSocketServer } from 'ws';
import { Demo } from './_mocks/demo.class';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import { Persistica } from '../lib/persistica.class';
import { it, describe, expect, beforeEach, afterEach } from 'vitest'
import { PersisticaWebsocketServer } from '@persistica/core';
import { LocalStorageMock } from './_mocks/local-storage.mock';
import { filter, firstValueFrom } from 'rxjs';

const wait = (
    timeoutMilliSeconds: number,
): Promise<void> => new Promise((resolve) => {
    setTimeout(resolve, timeoutMilliSeconds);
});

(<any>global).localStorage = new LocalStorageMock;
(<any>global).WebSocket = WebSocket;
global.WebSocketServer = WebSocketServer;

describe('persistica', () => {
    const persistica: Persistica = new Persistica();
    let persisticaWebsocketServer: PersisticaWebsocketServer;

    beforeEach(async () => {
        persisticaWebsocketServer = new PersisticaWebsocketServer(3_000);

        // Wait for the server to start listening
        await firstValueFrom(
            persisticaWebsocketServer
                .isListening$$
                .pipe(
                    filter((isListening: boolean) => isListening)
                ),
        );
    });

    afterEach(async () => {
        await persisticaWebsocketServer.close();

    });

    describe('Websocket server', () => {

        it('should create websocket server', () => {
            expect(persisticaWebsocketServer).toBeTruthy();
        });

        it('should listen', async () => {
            const isListeningSpy = subscribeSpyTo(persisticaWebsocketServer.isListening$$);

            expect(isListeningSpy.getLastValue()).toBeTruthy();
        });

        it('should accept a connection', async () => {
            // const isListeningSpy = subscribeSpyTo(persisticaWebsocketServer.isListening$$);

            // expect(isListeningSpy).toBeTruthy();

            const demo: Demo = new Demo(persisticaWebsocketServer.rpcServer, persistica.createWorkspace('nv-key-1'));
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();
            await wait(100);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');
            expect(persisticaWebsocketServer.connectedClients).toHaveLength(1);
        });

        it('should accept closing a connection', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer.rpcServer, persistica.createWorkspace('nv-key-1'));
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();

            await firstValueFrom(
                demo
                    .websocketState$$
                    .pipe(
                        filter((state) => state === 'connected')
                    ),
            );

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');
            expect(persisticaWebsocketServer.connectedClients).toHaveLength(1);

            demo.disconnect();
            await wait(10);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('disconnected');
            expect(persisticaWebsocketServer.connectedClients).toHaveLength(0);
        });

    });

    describe('Websocket client', () => {

        it('should send join request', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer.rpcServer, persistica.createWorkspace('nv-key-1'));
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connecting');
        });

        it('should connect to server', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer.rpcServer, persistica.createWorkspace('nv-key-1'));
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();

            await wait(1_000);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');
        });

    });

    describe('synchronization', () => {

        it('should start by deleting locally deleted elements from the server', async () => {

            const demo: Demo = new Demo(persisticaWebsocketServer.rpcServer, {
                networkId: 'ni-123',
                networkKey: 'network-key',
                clientId: 'ci-123',
                version: 1,
                knownPeers: [
                    // We don't have any known peers (should we then have deletes?)
                ],
                tableDeletes: [
                    {
                        tableName: 'some table-name',
                        deletes: [
                            {
                                cuid: 'cuid-123',
                                synchronizedWith: [
                                    // Not yet synchronized with anyone
                                ],
                            },
                        ],
                    },
                ],
            });
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);
            const clientSynchronizerStateSpy = subscribeSpyTo(demo.synchronizerState$$);

            demo.joinNetwork();

            await firstValueFrom(
                demo
                    .websocketState$$
                    .pipe(
                        filter((state) => state === 'connected'),
                    ),
            );

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');
            expect(persisticaWebsocketServer.connectedClients).toHaveLength(1);

            await firstValueFrom(
                demo
                    .synchronizerState$$
                    .pipe(
                        filter((state) => state === 'synchronizing-deletes'),
                    ),
            );

            expect(clientSynchronizerStateSpy.getValueAt(0)).toBe('synchronizing-deletes');
        });
    });

    describe('persistica', () => {

        it('emits the current value when new elements are created locally', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer.rpcServer, persistica.createWorkspace('nv-key-1'));

            const demoModelSpy = subscribeSpyTo(demo.demoModel.read$$({}));

            // The value should be emitted internally
            expect(demoModelSpy.receivedNext()).toEqual(false);
            expect(demoModelSpy.getLastValue()).toEqual(undefined);
            expect(demoModelSpy.receivedComplete()).toEqual(false);

            // * Act
            await demo.demoModel.create({
                id: 'uniqu-id',
                createdAt: new Date('2020-01-01'),
            });

            expect(demoModelSpy.receivedNext()).toEqual(true);
            expect(demoModelSpy.getLastValue()).toEqual([{
                id: "uniqu-id",
                createdAt: new Date('2020-01-01T00:00:00.000Z'),
            }]);
        });

        it('initialises states and joins networks', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer.rpcServer, persistica.createWorkspace('nv-key-1'));

            const storeStateSpy = subscribeSpyTo(demo.storeState$$);
            const networkStateSpy = subscribeSpyTo(demo.networkState$$);
            const websocketStateSpy = subscribeSpyTo(demo.websocketState$$);
            const synchronizerStateSpy = subscribeSpyTo(demo.synchronizerState$$);

            expect(storeStateSpy.getLastValue()).toEqual('idle');
            expect(networkStateSpy.getLastValue()).toEqual('disconnected');
            expect(websocketStateSpy.getLastValue()).toEqual('disconnected');

            demo.joinNetwork();

            await firstValueFrom(
                demo
                    .synchronizerState$$
                    .pipe(
                        filter((state) => !!state)
                    ),
            );

            expect(storeStateSpy.getLastValue()).toEqual('idle');
            expect(networkStateSpy.getLastValue()).toEqual('connected');
            expect(websocketStateSpy.getLastValue()).toEqual('connected');
            expect(synchronizerStateSpy.getLastValue()).toEqual('checking-store-states');
        });
    });
});