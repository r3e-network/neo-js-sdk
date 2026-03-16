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

export type GetBlockHeaderCountResult = number;
export type GetConnectionCountResult = number;

export interface RpcStackItemJson {
  type: string;
  value?: unknown;
  [key: string]: unknown;
}

export interface RpcNotification {
  contract: string;
  eventname: string;
  state: RpcStackItemJson;
}

export interface ApplicationLogInvocation {
  hash: string;
  method: string;
  arguments: {
    type: "Array";
    value: RpcStackItemJson[];
  };
  argumentscount: number;
  truncated: boolean;
}

export interface ApplicationLogExecution {
  trigger: string;
  vmstate: string;
  gasconsumed: string;
  stack?: RpcStackItemJson[];
  notifications: RpcNotification[];
  exception?: string | null;
  invocations?: ApplicationLogInvocation[];
}

export interface GetApplicationLogResult {
  txid?: string;
  blockhash?: string;
  executions: ApplicationLogExecution[];
}

export interface RpcValidatorResult {
  publickey: string;
  votes: string | number;
  active?: boolean;
}

export type GetCandidatesResult = RpcValidatorResult[];

export interface NodePeer {
  address: string;
  port: number;
}

export interface GetPeersResult {
  unconnected: NodePeer[];
  bad: NodePeer[];
  connected: NodePeer[];
}

export interface GetVersionProtocolResult {
  addressversion: number;
  network: number;
  validatorscount: number;
  msperblock: number;
  maxtraceableblocks: number;
  maxvaliduntilblockincrement: number;
  maxtransactionsperblock: number;
  memorypoolmaxtransactions: number;
  initialgasdistribution: number;
  hardforks?: Record<string, number>;
  committeehistory?: Record<string, number>;
}

export interface GetVersionResult {
  tcpport: number;
  wsport: number;
  nonce: number;
  useragent: string;
  protocol: GetVersionProtocolResult;
  rpc?: Record<string, unknown>;
}

export interface RpcPlugin {
  name: string;
  version: string;
  interfaces: string[];
  category?: string;
}

export type ListPluginsResult = RpcPlugin[];

export interface ValidateAddressResult {
  address: string;
  isvalid: boolean;
}

export interface RpcWitnessJson {
  invocation: string;
  verification: string;
}

export interface GetStateRootResult {
  version: number;
  index: number;
  roothash: string;
  witnesses?: RpcWitnessJson[];
}

export interface RpcSignerJson {
  account: string;
  scopes: string;
  allowedcontracts?: string[];
  allowedgroups?: string[];
  rules?: unknown[];
}

export interface GetRawTransactionResult {
  hash: string;
  size: number;
  version: number;
  nonce: number;
  sender: string;
  sysfee: string;
  netfee: string;
  validuntilblock: number;
  attributes: unknown[];
  signers: RpcSignerJson[];
  script: string;
  witnesses: RpcWitnessJson[];
  confirmations: number;
  blockhash: string;
  blocktime: number;
  vmstate?: string;
  vm_state?: string;
}

export interface InvokeResult<TStackItem = RpcStackItemJson> {
  script: string;
  state: string;
  gasconsumed: string;
  exception?: string | null;
  stack: TStackItem[];
  tx?: string;
  notifications?: RpcNotification[];
  session?: string;
  diagnostics?: unknown;
  pendingsignature?: unknown;
}

export type InvokeContractVerifyResult<TStackItem = RpcStackItemJson> = InvokeResult<TStackItem>;

export interface SendRawTransactionResult {
  hash: string;
}

export interface WalletBalanceResult {
  balance: string;
}

export interface RpcAccountResult {
  address: string;
  haskey: boolean;
  label: string | null;
  watchonly: boolean;
}

export type ListAddressResult = RpcAccountResult[];

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
