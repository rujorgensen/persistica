import {
    PersisticaWebsocketServer,
} from '@persistica/core';

const PORT: number = 3_001;

console.log(`⭕ Opening Persistica server on http://localhost:${PORT}`);
const persisticaWebsocketServer: PersisticaWebsocketServer = new PersisticaWebsocketServer(PORT);

persisticaWebsocketServer
    .isListening$$
    .subscribe((isListening: boolean) => {
        if (isListening) {
            console.log(`🚀 Persistica demo server running on http://localhost:${PORT}`);
        }
    });
