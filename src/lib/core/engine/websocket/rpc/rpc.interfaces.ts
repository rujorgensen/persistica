export type TCallback = (result: any) => void;

export interface RPCRequest {
    id: number;
    method: string;
    params: any[];
}

export interface RPCResponse {
    id: number;
    result: any;
    error?: string;
}
