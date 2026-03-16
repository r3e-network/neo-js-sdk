import type { H160, H256 } from "../core/hash.js";
import type { PublicKey } from "../core/keypair.js";
import type { Signer, Tx, SignerJson, TxAttributeJson } from "../core/tx.js";
import type { WitnessRuleJson } from "../core/witness-rule.js";

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
  endpointStrategy?: "first" | "round-robin";
  retryTransportErrors?: boolean;
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

export interface Base64Encodable {
  toBase64(asLittleEndian?: boolean): string;
}

export interface ContractParamLikeJson {
  toJson(): InvokeParameterJson;
}

export type GetBlockHeaderCountResult = number;
export type GetConnectionCountResult = number;
export type TransactionJsonResult = ReturnType<Tx["toJSON"]>;

export interface RpcBaseStackItemJson {
  type: string;
}

export interface RpcBooleanStackItemJson extends RpcBaseStackItemJson {
  type: "Boolean";
  value: boolean;
}

export interface RpcIntegerStackItemJson extends RpcBaseStackItemJson {
  type: "Integer";
  value: string;
}

export interface RpcByteStringStackItemJson extends RpcBaseStackItemJson {
  type: "ByteString";
  value: string;
}

export interface RpcBufferStackItemJson extends RpcBaseStackItemJson {
  type: "Buffer";
  value: string;
}

export interface RpcPointerStackItemJson extends RpcBaseStackItemJson {
  type: "Pointer";
  value: number;
}

export interface RpcAnyStackItemJson extends RpcBaseStackItemJson {
  type: "Any";
  value?: string;
}

export interface RpcInteropInterfaceStackItemJson extends RpcBaseStackItemJson {
  type: "InteropInterface";
  interface?: string;
  id?: string;
}

export interface RpcArrayStackItemJson extends RpcBaseStackItemJson {
  type: "Array";
  value: RpcStackItemJson[];
}

export interface RpcStructStackItemJson extends RpcBaseStackItemJson {
  type: "Struct";
  value: RpcStackItemJson[];
}

export interface RpcMapStackEntryJson {
  key: RpcStackItemJson;
  value: RpcStackItemJson;
}

export interface RpcMapStackItemJson extends RpcBaseStackItemJson {
  type: "Map";
  value: RpcMapStackEntryJson[];
}

export type RpcStackItemJson =
  | RpcBooleanStackItemJson
  | RpcIntegerStackItemJson
  | RpcByteStringStackItemJson
  | RpcBufferStackItemJson
  | RpcPointerStackItemJson
  | RpcAnyStackItemJson
  | RpcInteropInterfaceStackItemJson
  | RpcArrayStackItemJson
  | RpcStructStackItemJson
  | RpcMapStackItemJson;

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

export interface GetBlockHeaderVerboseResult {
  hash: string;
  size: number;
  version: number;
  previousblockhash: string;
  merkleroot: string;
  time: number;
  nonce: string;
  index: number;
  primary: number;
  nextconsensus: string;
  witnesses: RpcWitnessJson[];
  confirmations: number;
  nextblockhash?: string;
}

export interface GetBlockVerboseResult extends GetBlockHeaderVerboseResult {
  tx: TransactionJsonResult[];
}

export interface GetContractStateNefMethodTokenResult {
  hash: string;
  method: string;
  parameterscount: number;
  hasreturnvalue: boolean;
  callflags: string;
}

export interface GetContractStateNefResult {
  magic?: number;
  compiler: string;
  source: string;
  tokens: GetContractStateNefMethodTokenResult[];
  script: string;
  checksum: number;
}

export interface GetContractStateManifestParameterResult {
  name: string;
  type: string;
}

export interface GetContractStateManifestMethodResult {
  name: string;
  offset: number;
  parameters: GetContractStateManifestParameterResult[];
  returntype: string;
  safe: boolean;
}

export interface GetContractStateManifestEventResult {
  name: string;
  parameters: GetContractStateManifestParameterResult[];
}

export interface GetContractStateManifestAbiResult {
  methods: GetContractStateManifestMethodResult[];
  events: GetContractStateManifestEventResult[];
}

export interface GetContractStateManifestGroupResult {
  pubkey: string;
  signature: string;
}

export interface GetContractStateManifestPermissionResult {
  contract: string;
  methods: "*" | string[];
}

export interface GetContractStateManifestResult {
  name: string;
  groups: GetContractStateManifestGroupResult[];
  features: Record<string, never>;
  supportedstandards: string[];
  abi: GetContractStateManifestAbiResult;
  permissions: GetContractStateManifestPermissionResult[];
  trusts: "*" | string[];
  extra?: unknown;
}

export interface GetContractStateResult {
  id: number;
  updatecounter: number;
  hash: string;
  nef: GetContractStateNefResult;
  manifest: GetContractStateManifestResult;
}

export type GetNativeContractsResult = GetContractStateResult[];

export interface Nep11TokenBalance {
  tokenid: string;
  amount: string;
  lastupdatedblock: number;
}

export interface Nep11Balance {
  assethash: string;
  name?: string;
  symbol?: string;
  decimals?: string | number;
  tokens: Nep11TokenBalance[];
}

export interface GetNep11BalancesResult {
  address: string;
  balance: Nep11Balance[];
}

export type GetNep11PropertyValueResult = string | null;
export type GetNep11PropertiesResult = Record<string, GetNep11PropertyValueResult>;

export interface Nep11TransferEvent {
  timestamp: number;
  assethash: string;
  transferaddress: string | null;
  amount: string;
  blockindex: number;
  transfernotifyindex: number;
  txhash: string;
  tokenid: string;
}

export interface GetNep11TransfersResult {
  address: string;
  sent: Nep11TransferEvent[];
  received: Nep11TransferEvent[];
}

export interface Nep17Balance {
  assethash: string;
  amount: string;
  lastupdatedblock: number;
}

export interface GetNep17BalancesResult {
  address: string;
  balance: Nep17Balance[];
}

export interface Nep17TransferEvent {
  timestamp: number;
  assethash: string;
  transferaddress: string | null;
  amount: string;
  blockindex: number;
  transfernotifyindex: number;
  txhash: string;
}

export interface GetNep17TransfersResult {
  address: string;
  sent: Nep17TransferEvent[];
  received: Nep17TransferEvent[];
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
  hardforks?: GetVersionHardforkResult[];
  standbycommittee?: string[];
  seedlist?: string[];
}

export interface GetVersionHardforkResult {
  name: string;
  blockheight: number;
}

export interface GetVersionResult {
  tcpport: number;
  wsport: number;
  nonce: number;
  useragent: string;
  protocol: GetVersionProtocolResult;
  rpc?: GetVersionRpcSettingsResult;
}

export interface GetVersionRpcSettingsResult {
  maxiteratorresultitems: number;
  sessionenabled: boolean;
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
  rules?: WitnessRuleJson[];
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
  attributes: TxAttributeJson[];
  signers: RpcSignerJson[];
  script: string;
  witnesses: RpcWitnessJson[];
  confirmations: number;
  blockhash: string;
  blocktime: number;
  vmstate?: string;
  vm_state?: string;
}

export interface GetRawMemPoolVerboseResult {
  height: number;
  verified: string[];
  unverified: string[];
}

export type GetRawMemPoolResult = string[] | GetRawMemPoolVerboseResult;

export interface GetStateHeightResult {
  localrootindex?: number | null;
  validatedrootindex?: number | null;
}

export type GetProofResult = string;
export type VerifyProofResult = string;
export type GetStateResult = string;
export type GetStorageResult = string;

export interface FindStorageEntry {
  key: string;
  value: string;
}

export interface FindStorageResult {
  truncated: boolean;
  next?: number;
  results: FindStorageEntry[];
}

export interface FindStatesResult {
  truncated: boolean;
  results: FindStorageEntry[];
  firstProof?: string;
  lastProof?: string;
}

export interface GetUnclaimedGasResult {
  unclaimed: string;
  address: string;
}

export interface UnspentTransaction {
  txid: string;
  n: number;
  value: number | string;
}

export interface UnspentBalance {
  unspent: UnspentTransaction[];
  assethash: string;
  asset?: string;
  asset_symbol?: string;
  amount: number | string;
}

export interface GetUnspentsResult {
  address: string;
  balance: UnspentBalance[];
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
  diagnostics?: InvokeDiagnosticsResult;
  pendingsignature?: PendingSignatureResult;
}

export interface InvokeDiagnosticsInvocationTree {
  hash: string;
  call?: InvokeDiagnosticsInvocationTree[];
}

export interface InvokeDiagnosticsStorageChange {
  state: string;
  key: string;
  value: string;
}

export interface InvokeDiagnosticsResult {
  invokedcontracts: InvokeDiagnosticsInvocationTree;
  storagechanges: InvokeDiagnosticsStorageChange[];
}

export interface PendingSignatureContextItem {
  script: string | null;
  parameters: InvokeParameterJson[];
  signatures: Record<string, string>;
}

export interface PendingSignatureResult {
  type: string;
  hash: string;
  data: string;
  items: Record<string, PendingSignatureContextItem>;
  network: number;
}

export type InvokeContractVerifyResult<TStackItem = RpcStackItemJson> = InvokeResult<TStackItem>;

export interface SendRawTransactionResult {
  hash: string;
}

export interface WalletBalanceResult {
  balance: string;
}

export type OpenWalletResult = boolean;
export type CloseWalletResult = boolean;
export type DumpPrivKeyResult = string;
export type GetNewAddressResult = string;
export type GetWalletUnclaimedGasResult = string;

export interface RpcAccountResult {
  address: string;
  haskey: boolean;
  label: string | null;
  watchonly: boolean;
}

export type ListAddressResult = RpcAccountResult[];
export type ImportPrivKeyResult = RpcAccountResult;

export type TraverseIteratorResult = RpcStackItemJson[];
export type TerminateSessionResult = boolean;

export interface RelayTransactionResult {
  hash: string;
  size: number;
  version: number;
  nonce: number;
  sender: string;
  sysfee: string;
  netfee: string;
  validuntilblock: number;
  attributes: TxAttributeJson[];
  signers: RpcSignerJson[];
  script: string;
  witnesses: RpcWitnessJson[];
}

export type CancelTransactionResult = RelayTransactionResult;
export type SubmitBlockResult = SendRawTransactionResult;
export interface NetworkFeeResult {
  networkfee: string;
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
