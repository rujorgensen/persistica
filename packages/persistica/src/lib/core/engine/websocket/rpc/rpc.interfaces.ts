export type TCallback = (result: any) => void;

export interface RPCRequest<TMethods> {
    id: number;
    method: TMethods;
    params: any[];
}

export interface RPCResponse {
    id: number;
    result: any;
    error?: string;
}
