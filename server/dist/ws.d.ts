import { WebSocketServer } from 'ws';
import type { Express } from 'express';
declare let wss: WebSocketServer;
export declare function startServer(): {
    app: Express;
    wss: WebSocketServer;
};
export { wss };
