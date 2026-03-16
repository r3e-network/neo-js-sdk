import type { H160, H256 } from "../core/hash.js";
import type { PublicKey } from "../core/keypair.js";
import type { Signer, Tx } from "../core/tx.js";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: unknown[];
}

export interface JsonRpcErrorShape {
  code: number;
  message: string;
}

export interface JsonRpcSuccess<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result: T;
}

export interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: number;
  error: JsonRpcErrorShape;
}

export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcFailure;

export type JsonRpcTransport = (
  url: string,
  request: JsonRpcRequest,
  timeoutMs: number
) => Promise<JsonRpcResponse>;

export interface JsonRpcOptions {
  timeoutMs?: number;
  transport?: JsonRpcTransport;
}

export interface RpcClientOptions extends JsonRpcOptions {
  jsonrpc?: JsonRpcLike;
}

export interface JsonRpcLike {
  send<T = unknown>(method: string, params?: unknown[]): Promise<T>;
}

export interface InvokeParameterJson {
  type: string;
  value?: unknown;
}

export interface SignerLikeJson {
  toJSON(): unknown;
}

export type InvokeSerializable =
  | H160
  | H256
  | PublicKey
  | Tx
  | Signer
  | Uint8Array
  | string;
