import 'fake-indexeddb/auto';
import { Demo } from './_mocks/demo.class';
import { subscribeSpyTo } from '@hirez_io/observer-spy';
import { Persistica } from '../lib/persistica.class';
import { it, describe, expect, mock, beforeEach } from 'bun:test';
import { PersisticaWebsocketServer } from '@persistica/core';
import { LocalStorageMock } from './_mocks/local-storage.mock';

const wait = (
    timeout: number,
): Promise<void> => new Promise((resolve) => {
    setTimeout(resolve, timeout);
});

class WebsocketWrapper {
    private callbacks: Map<string, (...args) => void> = new Map()

    public onConnection(cb: (
        ws: WebSocketMock,
    ) => void): void {
        this.callbacks.set('connection', cb);
    }

    public onOpen(cb: (

    ) => void): void {
        this.callbacks.set('onopen', cb);
    }

    public onClose(cb: (

    ) => void): void {
        this.callbacks.set('onclose', cb);
    }

    public onMessageOnClient(cb: (
        msg: string,
    ) => void): void {
        this.callbacks.set('onmessage', cb);
    }

    // public onMessageOnServer(cb: (
    //     msg: string,
    // ) => void): void {
    //     this.callbacks.set('send-message-to-server', cb);
    // }

    public connectToServer(
        ws: WebSocketMock,
    ): void {
        setTimeout(() => {

            // Emit event to server
            this.callbacks.get('connection')(ws);

            // Emit event to client
            this.callbacks.get('onopen')();
        });
    }

    public closeConnection(
        ws: WebSocketMock,
    ): void {
        setTimeout(() => {
            // Emit event to server
            ws.onclose();//   this.callbacks.get('trig-disconnection')(ws);

            // Emit event to client
            this.callbacks.get('onclose')();
        });
    }

    public sendMessage(
        ws: WebSocketMock,
        msg: string,
    ): void {
        setTimeout(() => {
            // Emit event to client
            // this.callbacks.get('send-message-to-server')(msg);
            ws.onmessage(msg);
        });
    }
}

const websocketWrapper: WebsocketWrapper = new WebsocketWrapper();

class WebSocketMock {
    constructor(
        private path: string,
    ) {
        websocketWrapper.onOpen(() => this.onopen());
        websocketWrapper.onClose(() => this.onclose());
        websocketWrapper.onMessageOnClient(() => this.onmessage());

        websocketWrapper.connectToServer(this);
    }

    public onopen;
    public onclose;
    public onmessage

    public send(
        message: string,
    ) {
        websocketWrapper.sendMessage(this, <any>{
            data: message,
            type: '-unknown-type-',
            target: this,
        });
    }

    public close(
    ) {
        websocketWrapper.closeConnection(this);
    }
}

class WebSocketServer {
    private callbacks: Map<string, (...args) => void> = new Map()

    constructor(

    ) {
        //  websocketWrapper.onMessageOnServer((msg) => this.onmessage(msg));

        websocketWrapper.onConnection((ws) => {
            this.callbacks.get('connection')(ws);

        });

        setTimeout(() => {
            this.callbacks.get('listening')();
        });
    }

    //public onmessage;

    public on(
        event: string,
        callback: () => void,
    ): void {
        this.callbacks.set(event, callback);
    }
}

(<any>global).localStorage = new LocalStorageMock;
(<any>global).WebSocket = WebSocketMock;
(<any>global).WebSocketServer = WebSocketServer;

describe('persistica', () => {
    const persistica: Persistica = new Persistica();
    let persisticaWebsocketServer: PersisticaWebsocketServer;

    mock.module('ws', () => ({
        WebSocketServer,
    }));

    beforeEach(() => {
        persisticaWebsocketServer = new PersisticaWebsocketServer(3_000);
    });

    describe('Websocket client', () => {

        it('should send join request', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer, persistica.createWorkspace());
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connecting');
        });

        it('should connect to server', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer, persistica.createWorkspace());
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();

            await wait(1);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');
        });

    });

    describe('Websocket server', () => {

        it('should create websocket server', async () => {
            expect(persisticaWebsocketServer).toBeTruthy();
        });

        it('should listen', async () => {
            const isListeningSpy = subscribeSpyTo(persisticaWebsocketServer.isListening$$);

            await wait(1);

            expect(isListeningSpy.getLastValue()).toBeTruthy();
        });

        it('should accept a connection', async () => {
            const isListeningSpy = subscribeSpyTo(persisticaWebsocketServer.isListening$$);

            expect(isListeningSpy).toBeTruthy();

            const demo: Demo = new Demo(persisticaWebsocketServer, persistica.createWorkspace());
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();
            await wait(1);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');
            expect(persisticaWebsocketServer.connectedClients).toHaveLength(1);
        });

        it('should accept a closed connection', async () => {
            const isListeningSpy = subscribeSpyTo(persisticaWebsocketServer.isListening$$);

            expect(isListeningSpy).toBeTruthy();

            const demo: Demo = new Demo(persisticaWebsocketServer, persistica.createWorkspace());
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);

            demo.joinNetwork();
            await wait(1);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');
            expect(persisticaWebsocketServer.connectedClients).toHaveLength(1);

            demo.disconnect();
            await wait(1);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('disconnected');
            expect(persisticaWebsocketServer.connectedClients).toHaveLength(0);
        });

    });

    describe.only('synchronization', () => {
        it('should start by deleting locally deleted elements', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer, {
                networkId: 'ni-123',
                networkKey: 'network-key',
                clientId: 'ci-123',
                version: 1,
                knownPeers: [],
                deletes: [
                    {
                        cuid: 'cuid-123',
                        synchronizedWith: [],
                    },
                ],
            });
            const clientWebsocketStateSpy = subscribeSpyTo(demo.websocketState$$);
            const clientSynchronizerStateSpy = subscribeSpyTo(demo.synchronizerState$$);

            demo.joinNetwork();
            await wait(1);
            await wait(100);

            expect(clientWebsocketStateSpy.getLastValue()).toBe('connected');

            expect(persisticaWebsocketServer.connectedClients).toHaveLength(1);
            expect(clientSynchronizerStateSpy.getLastValue()).toBe('synchronizing-table');
        });

    });

    describe('persistica2', () => {

        it('should exist', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer, persistica.createWorkspace());

            expect(demo).toBeTruthy();
        });

        it('emits the current value when new elements are created locally', async () => {
            const demo: Demo = new Demo(persisticaWebsocketServer, persistica.createWorkspace());

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
            const demo: Demo = new Demo(persisticaWebsocketServer, persistica.createWorkspace());

            const storeStateSpy = subscribeSpyTo(demo.storeState$$);
            const networkStateSpy = subscribeSpyTo(demo.networkState$$);
            const websocketStateSpy = subscribeSpyTo(demo.websocketState$$);
            const synchronizerStateSpy = subscribeSpyTo(demo.synchronizerState$$);

            expect(storeStateSpy.getLastValue()).toEqual('idle');
            expect(networkStateSpy.getLastValue()).toEqual('disconnected');
            expect(websocketStateSpy.getLastValue()).toEqual('disconnected');
            expect(synchronizerStateSpy.getLastValue()).toEqual('idle');

            demo.joinNetwork();

            expect(storeStateSpy.getLastValue()).toEqual('idle');
            expect(networkStateSpy.getLastValue()).toEqual('connecting');
            expect(websocketStateSpy.getLastValue()).toEqual('connecting');
            expect(synchronizerStateSpy.getLastValue()).toEqual('idle');
        });




    });
});