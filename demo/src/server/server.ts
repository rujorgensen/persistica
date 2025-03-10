import {
    PersisticaWebsocketServer,
} from '@persistica/core';

const PORT: number = 3_001;
const persisticaWebsocketServer: PersisticaWebsocketServer = new PersisticaWebsocketServer(PORT);

persisticaWebsocketServer
    .isListening$$
    .subscribe((isListening: boolean) => {
        if (isListening) {
            console.log(`🚀 Demo server running on http://localhost:${PORT}`);
        } else {
            console.log(`⭕ Opening Persistica server on http://localhost:${PORT}`);
        }
    });
