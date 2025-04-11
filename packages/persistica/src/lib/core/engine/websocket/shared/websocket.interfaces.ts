import type { RPCRequest, RPCResponse } from '../rpc/rpc.interfaces';

export type TChannel =
    'data' |
    'state' |
    'version' |
    'databaseHash' |
    'onCreate' |
    'onUpdate' |
    'onDelete' |
    'create' |
    'update' |
    'delete'
    ;

export interface IJoinMessage {
    type: 'join';
    payload: TChannel;
}

export interface IChannelMessage {
    type: 'message';
    payload: {
        channel: TChannel;
        data: any;
    };
}

export interface IRPCCallback {
    type: 'rpc-request';
    payload: RPCRequest;
}

export interface IRPCCallbackResponse {
    type: 'rpc-response';
    payload: RPCResponse;
}

export type TMessage = IJoinMessage | IChannelMessage | IRPCCallback | IRPCCallbackResponse;
