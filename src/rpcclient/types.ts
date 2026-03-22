import type { H160, H256 } from "../core/hash.js";
import type { PublicKey } from "../core/keypair.js";
import type { Signer, SignerJson, Tx, TxAttributeJson } from "../core/tx.js";
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

export type BooleanLikeParam = 0 | 1 | boolean;

export interface InvokeParameterJson {
  type: string;
  value?: unknown;
}

export interface Base64Encodable {
  toBase64(asLittleEndian?: boolean): string;
}

export interface ContractParamLikeJson {
  toJSON?(): InvokeParameterJson;
  toJson?(): InvokeParameterJson;
}

export interface InvokeParametersLike {
  toJSON(): InvokeParameterJson[];
}

export type RpcBinaryPayload = Tx | Uint8Array | string | Base64Encodable;
export type RpcInvokeArgsInput =
  | InvokeParametersLike
  | Array<InvokeParameterJson | ContractParamLikeJson | Record<string, unknown>>;
export type RpcSignerInput = Array<Signer | SignerJson | Record<string, unknown>>;

export interface GetBlockInput {
  indexOrHash: number | string;
  verbose?: BooleanLikeParam;
}

export interface GetBlockHashInput {
  blockIndex: number;
}

export interface GetBlockHeaderInput {
  indexOrHash?: number | string;
  blockHash?: H256 | string | null;
  height?: number | null;
  verbose?: BooleanLikeParam;
}

export interface GetApplicationLogInput {
  hash: H256 | string;
  trigger?: string;
}

export interface GetContractStateInput {
  scriptHash: H160 | string;
}

export interface GetNep11BalancesInput {
  account: string;
}

export interface GetNep11PropertiesInput {
  contractHash: H160 | string;
  tokenId: string;
}

export interface GetNep11TransfersInput {
  account: string;
  startTime?: string;
  endTime?: string;
}

export interface GetNep17TransfersInput {
  account: string;
  startTime?: string;
  endTime?: string;
}

export interface GetNep17BalancesInput {
  account: string;
}

export interface GetRawTransactionInput {
  hash: H256 | string;
  verbose?: BooleanLikeParam;
}

export interface GetStateRootInput {
  index: number;
}

export interface GetProofInput {
  rootHash: H256 | string;
  contractHash: H160 | string;
  key: Uint8Array | string;
}

export interface VerifyProofInput {
  rootHash: H256 | string;
  proof: Uint8Array | string;
}

export interface GetStateInput {
  rootHash: H256 | string;
  contractHash: H160 | string;
  key: Uint8Array | string;
}

export interface GetStorageInput {
  scriptHash: H160 | string;
  key: Uint8Array | string;
}

export interface FindStorageInput {
  scriptHash: H160 | string;
  prefix: Uint8Array | string;
  start?: number;
}

export interface FindStatesInput {
  rootHash: H256 | string;
  contractHash: H160 | string;
  prefix: Uint8Array | string;
  from?: Uint8Array | string;
  count?: number;
}

export interface GetUnclaimedGasInput {
  address: string;
}

export interface GetTransactionHeightInput {
  hash: H256 | string;
}

export interface GetUnspentsInput {
  address: string;
}

export interface OpenWalletInput {
  path: string;
  password: string;
}

export interface DumpPrivKeyInput {
  address: string;
}

export interface GetWalletBalanceInput {
  assetId: H160 | string;
}

export interface ImportPrivKeyInput {
  wif: string;
}

export interface InvokeFunctionInput {
  contractHash: H160 | string;
  method: string;
  args?: RpcInvokeArgsInput;
  signers?: RpcSignerInput;
}

export interface InvokeContractVerifyInput {
  contractHash: H160 | string;
  args?: RpcInvokeArgsInput;
  signers?: RpcSignerInput;
}

export interface InvokeScriptInput {
  script: RpcBinaryPayload;
  signers?: RpcSignerInput;
}

export interface TraverseIteratorInput {
  sessionId: string;
  iteratorId: string;
  count: number;
}

export interface SendRawTransactionInput {
  tx: RpcBinaryPayload;
}

export interface SendManyTransferInput {
  asset: H160 | string;
  value: bigint | number | string;
  address: string;
}

export interface SendFromInput {
  assetId: H160 | string;
  from: string;
  to: string;
  amount: bigint | number | string;
  signers?: Array<H160 | string>;
}

export interface SendManyInput {
  transfers: SendManyTransferInput[];
  from?: string;
  signers?: Array<H160 | string>;
}

export interface SendToAddressInput {
  assetId: H160 | string;
  to: string;
  amount: bigint | number | string;
}

export interface SubmitBlockInput {
  block: RpcBinaryPayload;
}

export interface ValidateAddressInput {
  address: string;
}

export interface CancelTransactionInput {
  txHash: H256 | string;
  signers?: Array<H160 | string>;
  extraFee?: bigint | number | string;
}

export interface CalculateNetworkFeeInput {
  tx: RpcBinaryPayload;
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
  id: string;
  amount: string;
  lastupdatedblock: number;
}

export interface Nep11Balance {
  assethash: string;
  name: string;
  symbol: string;
  decimals: string;
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
  transferaddress: string;
  amount: string;
  blockindex: number;
  transfernotifyindex: number;
  txhash: string;
  tokenid: string;
}

export interface GetNep11TransfersResult {
  sent: Nep11TransferEvent[];
  received: Nep11TransferEvent[];
  address: string;
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
  transferaddress: string;
  amount: string;
  blockindex: number;
  transfernotifyindex: number;
  txhash: string;
}

export interface GetNep17TransfersResult {
  sent: Nep17TransferEvent[];
  received: Nep17TransferEvent[];
  address: string;
}

export interface RpcValidatorResult {
  publickey: string;
  votes: string;
  active: boolean;
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
  committeehistory?: Record<string, number>;
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
  maxiteratorresultitems?: number;
  sessionenabled?: boolean;
}

export interface RpcPlugin {
  name: string;
  version: string;
  interfaces: string[];
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
  witnesses: RpcWitnessJson[];
}

export interface RpcSignerJson {
  account: string;
  scopes: string;
  allowedcontracts?: string[];
  allowedgroups?: string[];
  rules?: WitnessRuleJson[];
}

export interface GetRawTransactionResult {
  txid: string;
  size: number;
  version: number;
  nonce: number;
  sender: string;
  sysfee: string;
  netfee: string;
  validuntilblock: number;
  signers: RpcSignerJson[];
  attributes: TxAttributeJson[];
  script: string;
  witnesses: RpcWitnessJson[];
  blockhash?: string;
  confirmations?: number;
  blocktime?: number;
  vmstate?: string;
}

export interface GetRawMemPoolVerboseResult {
  height: number;
  verified: string[];
  unverified: string[];
}

export type GetRawMemPoolResult = string[] | GetRawMemPoolVerboseResult;

export interface GetStateHeightResult {
  localrootindex: number;
  validatedrootindex: number;
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
  results: Array<{
    key: string;
    value: string;
  }>;
}

export interface GetUnclaimedGasResult {
  unclaimed: string;
  address: string;
}

export interface UnspentTransaction {
  txid: string;
  n: number;
  value: string;
}

export interface UnspentBalance {
  asset_hash: string;
  asset: string;
  amount: string;
  unspent: UnspentTransaction[];
}

export interface GetUnspentsResult {
  address: string;
  balance: UnspentBalance[];
}

export interface InvokeResult<TStackItem = RpcStackItemJson> {
  script: string;
  state: string;
  gasconsumed: string;
  stack: TStackItem[];
  exception?: string | null;
  session?: string;
  notifications?: RpcNotification[];
  diagnostics?: InvokeDiagnosticsResult;
  tx?: string;
  pending_signature?: PendingSignatureResult;
}

export interface InvokeDiagnosticsInvocationTree {
  current: RpcNotification;
  calls?: InvokeDiagnosticsInvocationTree[];
}

export interface InvokeDiagnosticsStorageChange {
  state: string;
  key: string;
  value?: string;
}

export interface InvokeDiagnosticsResult {
  invocations?: InvokeDiagnosticsInvocationTree[];
  storagechanges?: InvokeDiagnosticsStorageChange[];
}

export interface PendingSignatureContextItem {
  account: string;
  scopes: string;
  allowedcontracts: string[];
  allowedgroups: string[];
  rules: WitnessRuleJson[];
  signatures: string[];
}

export interface PendingSignatureResult {
  type: string;
  hex: string;
  items: PendingSignatureContextItem[];
}

export type InvokeContractVerifyResult<TStackItem = RpcStackItemJson> = InvokeResult<TStackItem>;

export interface SendRawTransactionResult {
  hash: string;
}

export interface WalletBalanceResult {
  balance: string;
  confirmed: string;
}

export type OpenWalletResult = boolean;
export type CloseWalletResult = boolean;
export type DumpPrivKeyResult = string;
export type GetNewAddressResult = string;
export type GetWalletUnclaimedGasResult = string;

export interface RpcAccountResult {
  address: string;
  haskey: boolean;
  label?: string;
  watchonly: boolean;
}

export type ListAddressResult = RpcAccountResult[];
export type ImportPrivKeyResult = RpcAccountResult;

export type TraverseIteratorResult = RpcStackItemJson[];
export type TerminateSessionResult = boolean;

export interface RelayTransactionResult {
  hash: string;
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
  | InvokeParameterJson
  | ContractParamLikeJson
  | Signer
  | SignerJson
  | SignerLikeJson
  | H160
  | H256
  | PublicKey;
