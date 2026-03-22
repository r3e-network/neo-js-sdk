import { bytesToBase64, hexToBytes } from "../internal/bytes.js";
import { H160, H256 } from "../core/hash.js";
import { PublicKey } from "../core/keypair.js";
import { Signer, type SignerJson, Tx } from "../core/tx.js";
import type {
  CalculateNetworkFeeInput,
  CancelTransactionInput,
  Base64Encodable,
  BooleanLikeParam,
  CancelTransactionResult,
  CloseWalletResult,
  ContractParamLikeJson,
  DumpPrivKeyInput,
  DumpPrivKeyResult,
  FindStatesInput,
  FindStatesResult,
  FindStorageInput,
  FindStorageResult,
  GetApplicationLogInput,
  GetApplicationLogResult,
  GetBlockHashInput,
  GetBlockHeaderInput,
  GetBlockHeaderCountResult,
  GetBlockHeaderVerboseResult,
  GetBlockInput,
  GetBlockVerboseResult,
  GetCandidatesResult,
  GetConnectionCountResult,
  GetContractStateInput,
  GetContractStateResult,
  GetNativeContractsResult,
  GetNep11BalancesInput,
  GetNep11BalancesResult,
  GetNep11PropertiesInput,
  GetNep11PropertiesResult,
  GetNep17BalancesInput,
  GetNep11TransfersInput,
  GetNep11TransfersResult,
  GetNep17BalancesResult,
  GetNep17TransfersInput,
  GetNep17TransfersResult,
  GetNewAddressResult,
  GetPeersResult,
  GetProofInput,
  GetProofResult,
  GetRawMemPoolResult,
  GetRawMemPoolVerboseResult,
  GetRawTransactionInput,
  GetRawTransactionResult,
  GetStateInput,
  GetStateHeightResult,
  GetStateResult,
  GetStateRootInput,
  GetStateRootResult,
  GetStorageInput,
  GetStorageResult,
  GetTransactionHeightInput,
  GetUnclaimedGasInput,
  GetUnclaimedGasResult,
  GetUnspentsInput,
  GetUnspentsResult,
  GetVersionResult,
  GetWalletBalanceInput,
  GetWalletUnclaimedGasResult,
  ImportPrivKeyInput,
  ImportPrivKeyResult,
  InvokeContractVerifyResult,
  InvokeContractVerifyInput,
  InvokeFunctionInput,
  InvokeParameterJson,
  InvokeScriptInput,
  InvokeResult,
  JsonRpcLike,
  JsonRpcOptions,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcTransport,
  ListAddressResult,
  ListPluginsResult,
  NetworkFeeResult,
  OpenWalletInput,
  OpenWalletResult,
  RpcBinaryPayload,
  RpcInvokeArgsInput,
  RpcSignerInput,
  RelayTransactionResult,
  RpcClientOptions,
  SendRawTransactionResult,
  SendFromInput,
  SendManyInput,
  SendRawTransactionInput,
  SendToAddressInput,
  SubmitBlockResult,
  SubmitBlockInput,
  TerminateSessionResult,
  TraverseIteratorInput,
  TraverseIteratorResult,
  ValidateAddressInput,
  ValidateAddressResult,
  VerifyProofInput,
  WalletBalanceResult,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;

export enum RpcCode {
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  BadRequest = -32700,
  UnknownBlock = -101,
  UnknownContract = -102,
  UnknownTransaction = -103,
  UnknownStorageItem = -104,
  UnknownScriptContainer = -105,
  UnknownStateRoot = -106,
  UnknownSession = -107,
  UnknownIterator = -108,
  UnknownHeight = -109,
  InsufficientFundsWallet = -300,
  WalletFeeLimit = -301,
  NoOpenedWallet = -302,
  WalletNotFound = -303,
  WalletNotSupported = -304,
  UnknownAccount = -305,
  VerificationFailed = -500,
  AlreadyExists = -501,
  MempoolCapacityReached = -502,
  AlreadyInPool = -503,
  InsufficientNetworkFee = -504,
  PolicyFailed = -505,
  InvalidScript = -506,
  InvalidAttribute = -507,
  InvalidSignature = -508,
  InvalidSize = -509,
  ExpiredTransaction = -510,
  InsufficientFunds = -511,
  InvalidContractVerification = -512,
  AccessDenied = -600,
  SessionsDisabled = -601,
  OracleDisabled = -602,
  OracleRequestFinished = -603,
  OracleRequestNotFound = -604,
  OracleNotDesignatedNode = -605,
  UnsupportedState = -606,
  InvalidProof = -607,
  ExecutionFailed = -608,
}

export class JsonRpcError extends Error {
  public constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "JsonRpcError";
  }

  public override toString(): string {
    return `JsonRpcError{code:${this.code},message:${this.message}}`;
  }
}

async function defaultTransport(url: string, request: JsonRpcRequest, timeoutMs: number): Promise<JsonRpcResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    return (await response.json()) as JsonRpcResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeEndpoints(endpoints: string | string[]): string[] {
  return Array.isArray(endpoints) ? endpoints : [endpoints];
}

function serializeHash(value: H160 | H256 | string): string {
  return typeof value === "string" ? value : value.toString();
}

function encodeBinary(value: Tx | Uint8Array | string | Base64Encodable): string {
  if (value instanceof Tx) {
    return bytesToBase64(value.toBytes());
  }
  if (value instanceof Uint8Array) {
    return bytesToBase64(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && value !== null && "toBase64" in value && typeof value.toBase64 === "function") {
    return value.toBase64();
  }
  throw new Error("Unsupported binary payload");
}

function encodeStorageKey(value: Uint8Array | string): string {
  if (value instanceof Uint8Array) {
    return bytesToBase64(value);
  }
  return bytesToBase64(hexToBytes(value));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeToJson(item: any): unknown {
  if (typeof item === "object" && item !== null) {
    if (typeof item.toJSON === "function") {
      return item.toJSON();
    }
    if (typeof item.toJson === "function") {
      return item.toJson();
    }
  }
  return item;
}

function serializeSigners(signers: Array<Signer | SignerJson | Record<string, unknown>> = []): unknown[] {
  return signers.map(serializeToJson);
}

function serializeInvokeArgs(
  args: Array<InvokeParameterJson | ContractParamLikeJson | Record<string, unknown>>,
): unknown[] {
  return args.map(serializeToJson);
}

function serializeTransferValue(value: bigint | number | string): string {
  return typeof value === "string" ? value : BigInt(value).toString();
}

type HashLike = H160 | H256 | string;

export function mainnetEndpoints(): string[] {
  return [
    "http://seed1.neo.org:10332",
    "http://seed2.neo.org:10332",
    "http://seed3.neo.org:10332",
    "http://seed4.neo.org:10332",
    "http://seed5.neo.org:10332",
  ];
}

export function testnetEndpoints(): string[] {
  return [
    "http://seed1t5.neo.org:20332",
    "http://seed2t5.neo.org:20332",
    "http://seed3t5.neo.org:20332",
    "http://seed4t5.neo.org:20332",
    "http://seed5t5.neo.org:20332",
  ];
}

export class InvokeParameters {
  private readonly parameters: InvokeParameterJson[] = [];

  public addAny(): this {
    this.parameters.push({ type: "Any" });
    return this;
  }

  public addBool(value: boolean): this {
    this.parameters.push({ type: "Boolean", value });
    return this;
  }

  public addInteger(value: bigint | number): this {
    this.parameters.push({ type: "Integer", value: BigInt(value).toString() });
    return this;
  }

  public addHash160(value: H160 | string): this {
    this.parameters.push({ type: "Hash160", value: serializeHash(value) });
    return this;
  }

  public addHash256(value: H256 | string): this {
    this.parameters.push({ type: "Hash256", value: serializeHash(value) });
    return this;
  }

  public addPublicKey(value: PublicKey): this {
    this.parameters.push({ type: "PublicKey", value: value.toString() });
    return this;
  }

  public addString(value: string): this {
    this.parameters.push({ type: "String", value });
    return this;
  }

  public addSignature(value: Uint8Array | string): this {
    const encoded = typeof value === "string" ? value : bytesToBase64(value);
    this.parameters.push({ type: "Signature", value: encoded });
    return this;
  }

  public addByteArray(value: Uint8Array | string): this {
    const encoded = typeof value === "string" ? value : bytesToBase64(value);
    this.parameters.push({ type: "ByteArray", value: encoded });
    return this;
  }

  public toJSON(): InvokeParameterJson[] {
    return [...this.parameters];
  }
}

export class JsonRpc implements JsonRpcLike {
  private readonly endpoints: string[];
  private readonly timeoutMs: number;
  private readonly transport: JsonRpcTransport;
  private readonly endpointStrategy: "first" | "round-robin";
  private readonly retryTransportErrors: boolean;
  private nextId = 1;
  private nextEndpointIndex = 0;

  public constructor(endpoints: string | string[], options: JsonRpcOptions = {}) {
    this.endpoints = normalizeEndpoints(endpoints);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.transport = options.transport ?? defaultTransport;
    this.endpointStrategy = options.endpointStrategy ?? "first";
    this.retryTransportErrors = options.retryTransportErrors ?? false;
  }

  public async send<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    if (this.endpoints.length === 0) {
      throw new JsonRpcError(RpcCode.BadRequest, "no RPC endpoints configured");
    }

    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: this.nextId,
      method,
      params,
    };
    this.nextId += 1;

    const startIndex = this.endpointStrategy === "round-robin" ? this.nextEndpointIndex : 0;
    if (this.endpointStrategy === "round-robin") {
      this.nextEndpointIndex = (this.nextEndpointIndex + 1) % this.endpoints.length;
    }

    const maxAttempts = this.retryTransportErrors ? this.endpoints.length : 1;

    let lastTransportError: JsonRpcError | null = null;
    for (let offset = 0; offset < maxAttempts; offset += 1) {
      const endpointIndex = (startIndex + offset) % this.endpoints.length;
      const endpoint = this.endpoints[endpointIndex];

      try {
        const response = await this.transport(endpoint, request, this.timeoutMs);
        if ("error" in response && response.error) {
          const code = response.error?.code ?? RpcCode.InternalError;
          const message = response.error?.message ?? "unknown RPC error";
          throw new JsonRpcError(code, message);
        }
        if (!("result" in response)) {
          throw new JsonRpcError(RpcCode.InvalidRequest, "response missing result");
        }
        return response.result as T;
      } catch (error) {
        if (error instanceof JsonRpcError) {
          throw error;
        }

        lastTransportError = new JsonRpcError(
          RpcCode.InternalError,
          error instanceof Error ? error.message : String(error),
        );
        if (!this.retryTransportErrors) {
          break;
        }
      }
    }

    throw lastTransportError ?? new JsonRpcError(RpcCode.InternalError, "RPC request failed");
  }
}

export class RpcClient {
  private readonly jsonrpc: JsonRpcLike;

  public constructor(endpoints: string | string[] = [], options: RpcClientOptions = {}) {
    this.jsonrpc = options.jsonrpc ?? new JsonRpc(endpoints, options);
  }

  public async send<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    return this.jsonrpc.send<T>(method, params);
  }

  private callNoParams<T>(method: string): Promise<T> {
    return this.send(method);
  }

  private callSingleParam<T>(method: string, param: unknown): Promise<T> {
    return this.send(method, [param]);
  }

  private callHashParam<T>(method: string, value: HashLike): Promise<T> {
    return this.callSingleParam(method, serializeHash(value));
  }

  private callWithBooleanArg<T>(method: string, param: unknown, flag: BooleanLikeParam = 0): Promise<T> {
    return this.send(method, [param, flag]);
  }

  private callEncodedPayload<TResponse>(method: string, payload: RpcBinaryPayload): Promise<TResponse> {
    return this.callSingleParam(method, encodeBinary(payload));
  }

  private callAccountTimeRange<T>(method: string, account: string, startTime?: string, endTime?: string): Promise<T> {
    const params: unknown[] = [account];
    if (startTime !== undefined || endTime !== undefined) {
      params.push(startTime ?? "");
    }
    if (endTime !== undefined) {
      params.push(endTime);
    }
    return this.send(method, params);
  }

  private callStorageLookup<T>(method: string, scriptHash: H160 | string, key: Uint8Array | string): Promise<T> {
    return this.send(method, [serializeHash(scriptHash), encodeStorageKey(key)]);
  }

  private serializeInvokeInput(args?: RpcInvokeArgsInput): unknown[] {
    if (args === undefined) {
      return [];
    }
    return Array.isArray(args) ? serializeInvokeArgs(args) : args.toJSON();
  }

  private serializeSignerInput(signers?: RpcSignerInput): unknown[] {
    return serializeSigners(signers ?? []);
  }

  public getBestBlockHash(): Promise<string> {
    return this.callNoParams("getbestblockhash");
  }

  public getBlock(input: GetBlockInput & { verbose: true | 1 }): Promise<GetBlockVerboseResult>;
  public getBlock(input: GetBlockInput & { verbose?: false | 0 }): Promise<string>;
  public getBlock(input: GetBlockInput): Promise<string | GetBlockVerboseResult> {
    return this.callWithBooleanArg("getblock", input.indexOrHash, input.verbose ?? 0);
  }

  public getBlockCount(): Promise<number> {
    return this.callNoParams("getblockcount");
  }

  public getBlockHeaderCount(): Promise<number> {
    return this.callNoParams("getblockheadercount");
  }

  public getBlockHash(input: GetBlockHashInput): Promise<string> {
    return this.callSingleParam("getblockhash", input.blockIndex);
  }

  public getBlockHeader(input: GetBlockHeaderInput & { verbose: true | 1 }): Promise<GetBlockHeaderVerboseResult>;
  public getBlockHeader(input: GetBlockHeaderInput & { verbose?: false | 0 }): Promise<string>;
  public getBlockHeader(input: GetBlockHeaderInput): Promise<string | GetBlockHeaderVerboseResult> {
    const blockHash = input.blockHash instanceof H256 ? input.blockHash.toString() : (input.blockHash ?? null);
    const height = input.height ?? null;
    const indexOrHash = input.indexOrHash ?? null;
    const resolvedVerbose = input.verbose ?? 0;

    const providedLocators = [blockHash, height, indexOrHash].filter((value) => value !== null);
    if (providedLocators.length === 0) {
      return Promise.reject(new JsonRpcError(RpcCode.InvalidParams, "indexOrHash, blockHash, or height is required"));
    }
    if (providedLocators.length > 1) {
      return Promise.reject(new JsonRpcError(RpcCode.InvalidParams, "only one block locator may be set"));
    }

    return this.callWithBooleanArg("getblockheader", blockHash ?? height ?? indexOrHash!, resolvedVerbose);
  }

  public getApplicationLog(input: GetApplicationLogInput): Promise<GetApplicationLogResult> {
    const params: unknown[] = [serializeHash(input.hash)];
    if (input.trigger !== undefined) {
      params.push(input.trigger);
    }
    return this.send("getapplicationlog", params);
  }

  public getCandidates(): Promise<GetCandidatesResult> {
    return this.callNoParams("getcandidates");
  }

  public getCommittee(): Promise<string[]> {
    return this.callNoParams("getcommittee");
  }

  public getConnectionCount(): Promise<GetConnectionCountResult> {
    return this.callNoParams("getconnectioncount");
  }

  public getContractState(input: GetContractStateInput): Promise<GetContractStateResult> {
    return this.callHashParam("getcontractstate", input.scriptHash);
  }

  public getNativeContracts(): Promise<GetNativeContractsResult> {
    return this.callNoParams("getnativecontracts");
  }

  public getNep11Balances(input: GetNep11BalancesInput): Promise<GetNep11BalancesResult> {
    return this.callSingleParam("getnep11balances", input.account);
  }

  public getNep11Properties(input: GetNep11PropertiesInput): Promise<GetNep11PropertiesResult> {
    return this.send("getnep11properties", [serializeHash(input.contractHash), input.tokenId]);
  }

  public getNep11Transfers(input: GetNep11TransfersInput): Promise<GetNep11TransfersResult> {
    return this.callAccountTimeRange("getnep11transfers", input.account, input.startTime, input.endTime);
  }

  public getNep17Balances(input: GetNep17BalancesInput): Promise<GetNep17BalancesResult> {
    return this.callSingleParam("getnep17balances", input.account);
  }

  public getNep17Transfers(input: GetNep17TransfersInput): Promise<GetNep17TransfersResult> {
    return this.callAccountTimeRange("getnep17transfers", input.account, input.startTime, input.endTime);
  }

  public getNextBlockValidators(): Promise<GetCandidatesResult> {
    return this.callNoParams("getnextblockvalidators");
  }

  public getPeers(): Promise<GetPeersResult> {
    return this.callNoParams("getpeers");
  }

  public getRawMemPool(includeUnverified: true | 1): Promise<GetRawMemPoolVerboseResult>;
  public getRawMemPool(includeUnverified?: false | 0): Promise<string[]>;
  public getRawMemPool(includeUnverified: BooleanLikeParam = 0): Promise<GetRawMemPoolResult> {
    return this.callSingleParam("getrawmempool", includeUnverified);
  }

  public getRawTransaction(input: GetRawTransactionInput & { verbose: true | 1 }): Promise<GetRawTransactionResult>;
  public getRawTransaction(input: GetRawTransactionInput & { verbose?: false | 0 }): Promise<string>;
  public getRawTransaction(input: GetRawTransactionInput): Promise<string | GetRawTransactionResult> {
    return this.callWithBooleanArg("getrawtransaction", serializeHash(input.hash), input.verbose ?? 0);
  }

  public getStateHeight(): Promise<GetStateHeightResult> {
    return this.callNoParams("getstateheight");
  }

  public getStateRoot(input: GetStateRootInput): Promise<GetStateRootResult> {
    return this.callSingleParam("getstateroot", input.index);
  }

  public getProof(input: GetProofInput): Promise<GetProofResult> {
    return this.send("getproof", [
      serializeHash(input.rootHash),
      serializeHash(input.contractHash),
      encodeStorageKey(input.key),
    ]);
  }

  public verifyProof(input: VerifyProofInput): Promise<GetProofResult> {
    return this.send("verifyproof", [serializeHash(input.rootHash), encodeStorageKey(input.proof)]);
  }

  public getState(input: GetStateInput): Promise<GetStateResult> {
    return this.send("getstate", [
      serializeHash(input.rootHash),
      serializeHash(input.contractHash),
      encodeStorageKey(input.key),
    ]);
  }

  public getStorage(input: GetStorageInput): Promise<GetStorageResult> {
    return this.callStorageLookup("getstorage", input.scriptHash, input.key);
  }

  public findStorage(input: FindStorageInput): Promise<FindStorageResult> {
    return this.send("findstorage", [
      serializeHash(input.scriptHash),
      encodeStorageKey(input.prefix),
      input.start ?? 0,
    ]);
  }

  public findStates(input: FindStatesInput): Promise<FindStatesResult> {
    const params: unknown[] = [
      serializeHash(input.rootHash),
      serializeHash(input.contractHash),
      encodeStorageKey(input.prefix),
    ];

    if (input.from !== undefined || input.count !== undefined) {
      params.push(input.from === undefined ? "" : encodeStorageKey(input.from));
    }
    if (input.count !== undefined) {
      params.push(input.count);
    }

    return this.send("findstates", params);
  }

  public getTransactionHeight(input: GetTransactionHeightInput): Promise<number> {
    return this.callHashParam("gettransactionheight", input.hash);
  }

  public getUnclaimedGas(input: GetUnclaimedGasInput): Promise<GetUnclaimedGasResult> {
    return this.callSingleParam("getunclaimedgas", input.address);
  }

  public getUnspents(input: GetUnspentsInput): Promise<GetUnspentsResult> {
    return this.callSingleParam("getunspents", input.address);
  }

  public getVersion(): Promise<GetVersionResult> {
    return this.callNoParams("getversion");
  }

  public openWallet(input: OpenWalletInput): Promise<OpenWalletResult> {
    return this.send("openwallet", [input.path, input.password]);
  }

  public closeWallet(): Promise<CloseWalletResult> {
    return this.callNoParams("closewallet");
  }

  public dumpPrivKey(input: DumpPrivKeyInput): Promise<DumpPrivKeyResult> {
    return this.callSingleParam("dumpprivkey", input.address);
  }

  public getNewAddress(): Promise<GetNewAddressResult> {
    return this.callNoParams("getnewaddress");
  }

  public getWalletBalance(input: GetWalletBalanceInput): Promise<WalletBalanceResult> {
    return this.callHashParam("getwalletbalance", input.assetId);
  }

  public getWalletUnclaimedGas(): Promise<GetWalletUnclaimedGasResult> {
    return this.callNoParams("getwalletunclaimedgas");
  }

  public importPrivKey(input: ImportPrivKeyInput): Promise<ImportPrivKeyResult> {
    return this.callSingleParam("importprivkey", input.wif);
  }

  public listAddress(): Promise<ListAddressResult> {
    return this.callNoParams("listaddress");
  }

  public invokeFunction(input: InvokeFunctionInput): Promise<InvokeResult> {
    const serializedArgs = this.serializeInvokeInput(input.args);
    return this.send("invokefunction", [
      serializeHash(input.contractHash),
      input.method,
      serializedArgs,
      this.serializeSignerInput(input.signers),
    ]);
  }

  public invokeContractVerify(input: InvokeContractVerifyInput): Promise<InvokeContractVerifyResult> {
    const serializedArgs = this.serializeInvokeInput(input.args);
    return this.send("invokecontractverify", [
      serializeHash(input.contractHash),
      serializedArgs,
      this.serializeSignerInput(input.signers),
    ]);
  }

  public invokeScript(input: InvokeScriptInput): Promise<InvokeResult> {
    return this.send("invokescript", [encodeBinary(input.script), this.serializeSignerInput(input.signers)]);
  }

  public traverseIterator(input: TraverseIteratorInput): Promise<TraverseIteratorResult> {
    return this.send("traverseiterator", [input.sessionId, input.iteratorId, input.count]);
  }

  public terminateSession(input: { sessionId: string }): Promise<TerminateSessionResult> {
    return this.callSingleParam("terminatesession", input.sessionId);
  }

  public listPlugins(): Promise<ListPluginsResult> {
    return this.callNoParams("listplugins");
  }

  public sendRawTransaction(input: SendRawTransactionInput): Promise<SendRawTransactionResult> {
    return this.callEncodedPayload("sendrawtransaction", input.tx);
  }

  public sendFrom(input: SendFromInput): Promise<RelayTransactionResult> {
    const params: unknown[] = [
      serializeHash(input.assetId),
      input.from,
      input.to,
      serializeTransferValue(input.amount),
    ];

    const signers = (input.signers ?? []).map((signer) => serializeHash(signer));
    if (signers.length > 0) {
      params.push(signers);
    }

    return this.send("sendfrom", params);
  }

  public sendMany(input: SendManyInput): Promise<RelayTransactionResult> {
    const serializedTransfers = input.transfers.map((transfer) => ({
      asset: serializeHash(transfer.asset),
      value: serializeTransferValue(transfer.value),
      address: transfer.address,
    }));

    const params: unknown[] = [];
    if (input.from !== undefined) {
      params.push(input.from);
    }
    params.push(serializedTransfers);
    const signers = (input.signers ?? []).map((signer) => serializeHash(signer));
    if (signers.length > 0) {
      params.push(signers);
    }

    return this.send("sendmany", params);
  }

  public sendToAddress(input: SendToAddressInput): Promise<RelayTransactionResult> {
    return this.send("sendtoaddress", [serializeHash(input.assetId), input.to, serializeTransferValue(input.amount)]);
  }

  public submitBlock(input: SubmitBlockInput): Promise<SubmitBlockResult> {
    return this.callEncodedPayload("submitblock", input.block);
  }

  public validateAddress(input: ValidateAddressInput): Promise<ValidateAddressResult> {
    return this.callSingleParam("validateaddress", input.address);
  }

  public cancelTransaction(input: CancelTransactionInput): Promise<CancelTransactionResult> {
    const params: unknown[] = [
      serializeHash(input.txHash),
      (input.signers ?? []).map((signer) => serializeHash(signer)),
    ];
    if (input.extraFee !== undefined) {
      params.push(typeof input.extraFee === "string" ? input.extraFee : BigInt(input.extraFee).toString());
    }
    return this.send("canceltransaction", params);
  }

  public calculateNetworkFee(input: CalculateNetworkFeeInput): Promise<NetworkFeeResult> {
    return this.callEncodedPayload("calculatenetworkfee", input.tx);
  }
}

export type { JsonRpcOptions, JsonRpcRequest, JsonRpcResponse, JsonRpcTransport, RpcClientOptions } from "./types.js";
