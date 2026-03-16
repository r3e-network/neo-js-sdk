import { bytesToBase64, hexToBytes, toUint8Array } from "../internal/bytes.js";
import { H160, H256 } from "../core/hash.js";
import { PublicKey } from "../core/keypair.js";
import { Signer, type SignerJson, Tx } from "../core/tx.js";
import type {
  Base64Encodable,
  BooleanLikeParam,
  CancelTransactionResult,
  CloseWalletResult,
  ContractParamLikeJson,
  DumpPrivKeyResult,
  FindStatesResult,
  FindStorageResult,
  GetApplicationLogResult,
  GetBlockHeaderVerboseResult,
  GetBlockHeaderCountResult,
  GetBlockVerboseResult,
  GetCandidatesResult,
  GetContractStateResult,
  GetConnectionCountResult,
  GetNativeContractsResult,
  GetNep11BalancesResult,
  GetNep11PropertiesResult,
  GetNep11TransfersResult,
  GetNep17BalancesResult,
  GetNep17TransfersResult,
  GetPeersResult,
  GetProofResult,
  GetRawMemPoolResult,
  GetRawTransactionResult,
  GetStateHeightResult,
  GetStateResult,
  GetStorageResult,
  GetStateRootResult,
  GetUnclaimedGasResult,
  GetUnspentsResult,
  GetVersionResult,
  GetWalletUnclaimedGasResult,
  GetNewAddressResult,
  ImportPrivKeyResult,
  InvokeParameterJson,
  InvokeContractVerifyResult,
  InvokeResult,
  JsonRpcLike,
  JsonRpcOptions,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcTransport,
  ListAddressResult,
  ListPluginsResult,
  NetworkFeeResult,
  OpenWalletResult,
  RelayTransactionResult,
  RpcClientOptions,
  SendRawTransactionResult,
  SubmitBlockResult,
  TerminateSessionResult,
  TraverseIteratorResult,
  ValidateAddressResult,
  WalletBalanceResult
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
  ExecutionFailed = -608
}

export class JsonRpcError extends Error {
  public constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
    this.name = "JsonRpcError";
  }

  public override toString(): string {
    return `JsonRpcError{code:${this.code},message:${this.message}}`;
  }
}

async function defaultTransport(
  url: string,
  request: JsonRpcRequest,
  timeoutMs: number
): Promise<JsonRpcResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal: controller.signal
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

function serializeSigners(signers: Array<Signer | SignerJson | Record<string, unknown>> = []): unknown[] {
  return signers.map((signer) => ("toJSON" in signer && typeof signer.toJSON === "function" ? signer.toJSON() : signer));
}

function serializeInvokeArgs(args: Array<InvokeParameterJson | ContractParamLikeJson | Record<string, unknown>>): unknown[] {
  return args.map((arg) => ("toJson" in arg && typeof arg.toJson === "function" ? arg.toJson() : arg));
}

function serializeTransferAsset(value: H160 | string): string {
  return serializeHash(value);
}

function serializeTransferValue(value: bigint | number | string): string {
  return typeof value === "string" ? value : BigInt(value).toString();
}

function normalizeBooleanLike(value: BooleanLikeParam): boolean {
  return value === true || value === 1;
}

export function mainnetEndpoints(): string[] {
  return [
    "http://seed1.neo.org:10332",
    "http://seed2.neo.org:10332",
    "http://seed3.neo.org:10332",
    "http://seed4.neo.org:10332",
    "http://seed5.neo.org:10332"
  ];
}

export function mainnet_endpoints(): string[] {
  return mainnetEndpoints();
}

export function testnetEndpoints(): string[] {
  return [
    "http://seed1t5.neo.org:20332",
    "http://seed2t5.neo.org:20332",
    "http://seed3t5.neo.org:20332",
    "http://seed4t5.neo.org:20332",
    "http://seed5t5.neo.org:20332"
  ];
}

export function testnet_endpoints(): string[] {
  return testnetEndpoints();
}

export class InvokeParameters {
  private readonly parameters: InvokeParameterJson[] = [];

  public addAny(): this {
    this.parameters.push({ type: "Any" });
    return this;
  }

  public add_any(): this {
    return this.addAny();
  }

  public addBool(value: boolean): this {
    this.parameters.push({ type: "Boolean", value });
    return this;
  }

  public add_bool(value: boolean): this {
    return this.addBool(value);
  }

  public addInteger(value: bigint | number): this {
    this.parameters.push({ type: "Integer", value: BigInt(value).toString() });
    return this;
  }

  public add_integer(value: bigint | number): this {
    return this.addInteger(value);
  }

  public addHash160(value: H160 | string): this {
    this.parameters.push({ type: "Hash160", value: serializeHash(value) });
    return this;
  }

  public add_hash160(value: H160 | string): this {
    return this.addHash160(value);
  }

  public addHash256(value: H256 | string): this {
    this.parameters.push({ type: "Hash256", value: serializeHash(value) });
    return this;
  }

  public add_hash256(value: H256 | string): this {
    return this.addHash256(value);
  }

  public addPublicKey(value: PublicKey): this {
    this.parameters.push({ type: "PublicKey", value: value.toString() });
    return this;
  }

  public add_public_key(value: PublicKey): this {
    return this.addPublicKey(value);
  }

  public addString(value: string): this {
    this.parameters.push({ type: "String", value });
    return this;
  }

  public add_string(value: string): this {
    return this.addString(value);
  }

  public addSignature(value: Uint8Array | string): this {
    const encoded = typeof value === "string" ? value : bytesToBase64(value);
    this.parameters.push({ type: "Signature", value: encoded });
    return this;
  }

  public add_signature(value: Uint8Array | string): this {
    return this.addSignature(value);
  }

  public addByteArray(value: Uint8Array | string): this {
    const encoded = typeof value === "string" ? value : bytesToBase64(value);
    this.parameters.push({ type: "ByteArray", value: encoded });
    return this;
  }

  public add_byte_array(value: Uint8Array | string): this {
    return this.addByteArray(value);
  }

  public toJSON(): InvokeParameterJson[] {
    return [...this.parameters];
  }

  public to_json(): InvokeParameterJson[] {
    return this.toJSON();
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
      params
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
          throw new JsonRpcError(response.error.code, response.error.message);
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
          error instanceof Error ? error.message : String(error)
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

  public getBestBlockHash(): Promise<string> {
    return this.send("getbestblockhash");
  }

  public get_best_block_hash(): Promise<string> {
    return this.getBestBlockHash();
  }

  public getBlock(indexOrHash: number | string, verbose: true | 1): Promise<GetBlockVerboseResult>;
  public getBlock(indexOrHash: number | string, verbose?: false | 0): Promise<string>;
  public getBlock(indexOrHash: number | string, verbose: BooleanLikeParam = false): Promise<string | GetBlockVerboseResult> {
    return this.send("getblock", [indexOrHash, normalizeBooleanLike(verbose)]);
  }

  public get_block(indexOrHash: number | string, verbose: true | 1): Promise<GetBlockVerboseResult>;
  public get_block(indexOrHash: number | string, verbose?: false | 0): Promise<string>;
  public get_block(indexOrHash: number | string, verbose: BooleanLikeParam = true): Promise<string | GetBlockVerboseResult> {
    return normalizeBooleanLike(verbose) ? this.getBlock(indexOrHash, true) : this.getBlock(indexOrHash, false);
  }

  public getBlockCount(): Promise<number> {
    return this.send("getblockcount");
  }

  public get_block_count(): Promise<number> {
    return this.getBlockCount();
  }

  public getBlockHeaderCount(): Promise<number> {
    return this.send("getblockheadercount");
  }

  public get_block_header_count(): Promise<number> {
    return this.getBlockHeaderCount();
  }

  public getBlockHash(blockIndex: number): Promise<string> {
    return this.send("getblockhash", [blockIndex]);
  }

  public get_block_hash(blockIndex: number): Promise<string> {
    return this.getBlockHash(blockIndex);
  }

  public getBlockHeader(indexOrHash: number | string, verbose: true | 1): Promise<GetBlockHeaderVerboseResult>;
  public getBlockHeader(indexOrHash: number | string, verbose?: false | 0): Promise<string>;
  public getBlockHeader(indexOrHash: number | string, verbose: BooleanLikeParam = false): Promise<string | GetBlockHeaderVerboseResult> {
    return this.send("getblockheader", [indexOrHash, normalizeBooleanLike(verbose)]);
  }

  public get_block_header(indexOrHash: number | string, verbose: true | 1): Promise<GetBlockHeaderVerboseResult>;
  public get_block_header(indexOrHash: number | string, verbose?: false | 0): Promise<string>;
  public get_block_header(options: {
    block_hash?: H256 | string | null;
    height?: number | null;
    verbose?: BooleanLikeParam;
  }): Promise<string | GetBlockHeaderVerboseResult>;
  public get_block_header(
    indexOrHashOrOptions: number | string | { block_hash?: H256 | string | null; height?: number | null; verbose?: BooleanLikeParam },
    verbose: BooleanLikeParam = true
  ): Promise<string | GetBlockHeaderVerboseResult> {
    if (typeof indexOrHashOrOptions === "object" && indexOrHashOrOptions !== null) {
      const blockHash =
        indexOrHashOrOptions.block_hash instanceof H256
          ? indexOrHashOrOptions.block_hash.toString()
          : indexOrHashOrOptions.block_hash ?? null;
      const height = indexOrHashOrOptions.height ?? null;
      const resolvedVerbose = normalizeBooleanLike(indexOrHashOrOptions.verbose ?? true);

      if (blockHash === null && height === null) {
        return Promise.reject(new JsonRpcError(RpcCode.InvalidParams, "block_hash and height cannot be both None"));
      }
      if (blockHash !== null && height !== null) {
        return Promise.reject(new JsonRpcError(RpcCode.InvalidParams, "block_hash and height cannot be both set"));
      }

      return resolvedVerbose
        ? this.getBlockHeader(blockHash ?? height!, true)
        : this.getBlockHeader(blockHash ?? height!, false);
    }

    return verbose ? this.getBlockHeader(indexOrHashOrOptions, true) : this.getBlockHeader(indexOrHashOrOptions, false);
  }

  public getApplicationLog(hash: H256 | string, trigger?: string): Promise<GetApplicationLogResult> {
    const params: unknown[] = [serializeHash(hash)];
    if (trigger !== undefined) {
      params.push(trigger);
    }
    return this.send("getapplicationlog", params);
  }

  public get_application_log(hash: H256 | string, trigger?: string): Promise<GetApplicationLogResult> {
    return this.getApplicationLog(hash, trigger);
  }

  public getCandidates(): Promise<GetCandidatesResult> {
    return this.send("getcandidates");
  }

  public getCommittee(): Promise<string[]> {
    return this.send("getcommittee");
  }

  public get_committee(): Promise<string[]> {
    return this.getCommittee();
  }

  public getConnectionCount(): Promise<GetConnectionCountResult> {
    return this.send("getconnectioncount");
  }

  public get_connection_count(): Promise<GetConnectionCountResult> {
    return this.getConnectionCount();
  }

  public getContractState(scriptHash: H160 | string): Promise<GetContractStateResult> {
    return this.send("getcontractstate", [serializeHash(scriptHash)]);
  }

  public get_contract_state(scriptHash: H160 | string): Promise<GetContractStateResult> {
    return this.getContractState(scriptHash);
  }

  public getNativeContracts(): Promise<GetNativeContractsResult> {
    return this.send("getnativecontracts");
  }

  public get_native_contracts(): Promise<GetNativeContractsResult> {
    return this.getNativeContracts();
  }

  public getNep11Balances(account: string): Promise<GetNep11BalancesResult> {
    return this.send("getnep11balances", [account]);
  }

  public getNep11Properties(contractHash: H160 | string, tokenId: string): Promise<GetNep11PropertiesResult> {
    return this.send("getnep11properties", [serializeHash(contractHash), tokenId]);
  }

  public getNep11Transfers(account: string, startTime?: string, endTime?: string): Promise<GetNep11TransfersResult> {
    const params: unknown[] = [account];
    if (startTime !== undefined) {
      params.push(startTime);
    }
    if (endTime !== undefined) {
      params.push(endTime);
    }
    return this.send("getnep11transfers", params);
  }

  public getNep17Balances(account: string): Promise<GetNep17BalancesResult> {
    return this.send("getnep17balances", [account]);
  }

  public getNep17Transfers(account: string, startTime?: string, endTime?: string): Promise<GetNep17TransfersResult> {
    const params: unknown[] = [account];
    if (startTime !== undefined) {
      params.push(startTime);
    }
    if (endTime !== undefined) {
      params.push(endTime);
    }
    return this.send("getnep17transfers", params);
  }

  public getNextBlockValidators(): Promise<GetCandidatesResult> {
    return this.send("getnextblockvalidators");
  }

  public getPeers(): Promise<GetPeersResult> {
    return this.send("getpeers");
  }

  public get_peers(): Promise<GetPeersResult> {
    return this.getPeers();
  }

  public getRawMemPool(includeUnverified: true | 1): Promise<GetRawMemPoolResult>;
  public getRawMemPool(includeUnverified?: false | 0): Promise<GetRawMemPoolResult>;
  public getRawMemPool(includeUnverified: BooleanLikeParam = false): Promise<GetRawMemPoolResult> {
    return this.send("getrawmempool", [normalizeBooleanLike(includeUnverified)]);
  }

  public getRawTransaction(hash: H256 | string, verbose: true | 1): Promise<GetRawTransactionResult>;
  public getRawTransaction(hash: H256 | string, verbose?: false | 0): Promise<string>;
  public getRawTransaction(hash: H256 | string, verbose: BooleanLikeParam = false): Promise<string | GetRawTransactionResult> {
    return this.send("getrawtransaction", [serializeHash(hash), normalizeBooleanLike(verbose)]);
  }

  public getStateHeight(): Promise<GetStateHeightResult> {
    return this.send("getstateheight");
  }

  public getStateRoot(index: number): Promise<GetStateRootResult> {
    return this.send("getstateroot", [index]);
  }

  public getProof(rootHash: H256 | string, contractHash: H160 | string, key: Uint8Array | string): Promise<GetProofResult> {
    return this.send("getproof", [serializeHash(rootHash), serializeHash(contractHash), encodeStorageKey(key)]);
  }

  public verifyProof(rootHash: H256 | string, proof: Uint8Array | string): Promise<GetProofResult> {
    return this.send("verifyproof", [serializeHash(rootHash), encodeStorageKey(proof)]);
  }

  public getState(rootHash: H256 | string, contractHash: H160 | string, key: Uint8Array | string): Promise<GetStateResult> {
    return this.send("getstate", [serializeHash(rootHash), serializeHash(contractHash), encodeStorageKey(key)]);
  }

  public getStorage(scriptHash: H160 | string, key: Uint8Array | string): Promise<GetStorageResult> {
    return this.send("getstorage", [serializeHash(scriptHash), encodeStorageKey(key)]);
  }

  public findStorage(scriptHash: H160 | string, prefix: Uint8Array | string, start = 0): Promise<FindStorageResult> {
    return this.send("findstorage", [serializeHash(scriptHash), encodeStorageKey(prefix), start]);
  }

  public findStates(
    rootHash: H256 | string,
    contractHash: H160 | string,
    prefix: Uint8Array | string,
    from?: Uint8Array | string,
    count?: number
  ): Promise<FindStatesResult> {
    const params: unknown[] = [
      serializeHash(rootHash),
      serializeHash(contractHash),
      encodeStorageKey(prefix)
    ];

    if (from !== undefined || count !== undefined) {
      params.push(from === undefined ? "" : encodeStorageKey(from));
    }
    if (count !== undefined) {
      params.push(count);
    }

    return this.send("findstates", params);
  }

  public getTransactionHeight(hash: H256 | string): Promise<number> {
    return this.send("gettransactionheight", [serializeHash(hash)]);
  }

  public getUnclaimedGas(address: string): Promise<string> {
    return this.send<GetUnclaimedGasResult>("getunclaimedgas", [address]).then((response) => response.unclaimed);
  }

  public getUnspents(address: string): Promise<GetUnspentsResult> {
    return this.send("getunspents", [address]);
  }

  public getVersion(): Promise<GetVersionResult> {
    return this.send("getversion");
  }

  public get_version(): Promise<GetVersionResult> {
    return this.getVersion();
  }

  public openWallet(path: string, password: string): Promise<OpenWalletResult> {
    return this.send("openwallet", [path, password]);
  }

  public closeWallet(): Promise<CloseWalletResult> {
    return this.send("closewallet");
  }

  public dumpPrivKey(address: string): Promise<DumpPrivKeyResult> {
    return this.send("dumpprivkey", [address]);
  }

  public getNewAddress(): Promise<GetNewAddressResult> {
    return this.send("getnewaddress");
  }

  public getWalletBalance(assetId: H160 | string): Promise<WalletBalanceResult> {
    return this.send("getwalletbalance", [serializeHash(assetId)]);
  }

  public getWalletUnclaimedGas(): Promise<GetWalletUnclaimedGasResult> {
    return this.send("getwalletunclaimedgas");
  }

  public importPrivKey(wif: string): Promise<ImportPrivKeyResult> {
    return this.send("importprivkey", [wif]);
  }

  public listAddress(): Promise<ListAddressResult> {
    return this.send("listaddress");
  }

  public invokeFunction(
    contractHash: H160 | string,
    method: string,
    args: InvokeParameters | Array<InvokeParameterJson | ContractParamLikeJson | Record<string, unknown>> = [],
    signers: Array<Signer | SignerJson | Record<string, unknown>> = []
  ): Promise<InvokeResult> {
    const serializedArgs = Array.isArray(args) ? serializeInvokeArgs(args) : args.toJSON();
    return this.send("invokefunction", [
      serializeHash(contractHash),
      method,
      serializedArgs,
      serializeSigners(signers)
    ]);
  }

  public invoke_function(
    contractHash: H160 | string,
    method: string,
    args: InvokeParameters | Array<InvokeParameterJson | ContractParamLikeJson | Record<string, unknown>> = [],
    signers: Array<Signer | SignerJson | Record<string, unknown>> = []
  ): Promise<InvokeResult> {
    return this.invokeFunction(contractHash, method, args, signers);
  }

  public invokeContractVerify(
    contractHash: H160 | string,
    args: InvokeParameters | Array<InvokeParameterJson | ContractParamLikeJson | Record<string, unknown>> = [],
    signers: Array<Signer | SignerJson | Record<string, unknown>> = []
  ): Promise<InvokeContractVerifyResult> {
    const serializedArgs = Array.isArray(args) ? serializeInvokeArgs(args) : args.toJSON();
    return this.send("invokecontractverify", [
      serializeHash(contractHash),
      serializedArgs,
      serializeSigners(signers)
    ]);
  }

  public invoke_contract_verify(
    contractHash: H160 | string,
    args: InvokeParameters | Array<InvokeParameterJson | ContractParamLikeJson | Record<string, unknown>> = [],
    signers: Array<Signer | SignerJson | Record<string, unknown>> = []
  ): Promise<InvokeContractVerifyResult> {
    return this.invokeContractVerify(contractHash, args, signers);
  }

  public invokeScript(script: Uint8Array | string | Base64Encodable, signers: Array<Signer | SignerJson | Record<string, unknown>> = []): Promise<InvokeResult> {
    return this.send("invokescript", [encodeBinary(script), serializeSigners(signers)]);
  }

  public invoke_script(script: Uint8Array | string | Base64Encodable, signers: Array<Signer | SignerJson | Record<string, unknown>> = []): Promise<InvokeResult> {
    return this.invokeScript(script, signers);
  }

  public traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<TraverseIteratorResult> {
    return this.send("traverseiterator", [sessionId, iteratorId, count]);
  }

  public traverse_iterator(sessionId: string, iteratorId: string, count: number): Promise<TraverseIteratorResult> {
    return this.traverseIterator(sessionId, iteratorId, count);
  }

  public terminateSession(sessionId: string): Promise<TerminateSessionResult> {
    return this.send("terminatesession", [sessionId]);
  }

  public listPlugins(): Promise<ListPluginsResult> {
    return this.send("listplugins");
  }

  public list_plugins(): Promise<ListPluginsResult> {
    return this.listPlugins();
  }

  public sendRawTransaction(tx: Tx | Uint8Array | string | Base64Encodable): Promise<string> {
    return this.send<SendRawTransactionResult>("sendrawtransaction", [encodeBinary(tx)]).then((response) => response.hash);
  }

  public send_raw_transaction(tx: Tx | Uint8Array | string | Base64Encodable): Promise<SendRawTransactionResult> {
    return this.send("sendrawtransaction", [encodeBinary(tx)]);
  }

  public sendTx(tx: Tx | Uint8Array | string | Base64Encodable): Promise<string> {
    return this.send<SendRawTransactionResult>("sendrawtransaction", [encodeBinary(tx)]).then((response) => response.hash);
  }

  public send_tx(tx: Tx | Uint8Array | string | Base64Encodable): Promise<SendRawTransactionResult> {
    return this.send("sendrawtransaction", [encodeBinary(tx)]);
  }

  public sendFrom(
    assetId: H160 | string,
    from: string,
    to: string,
    amount: bigint | number | string,
    signers: Array<H160 | string> = []
  ): Promise<RelayTransactionResult> {
    const params: unknown[] = [
      serializeTransferAsset(assetId),
      from,
      to,
      serializeTransferValue(amount)
    ];

    if (signers.length > 0) {
      params.push(signers.map((signer) => serializeHash(signer)));
    }

    return this.send("sendfrom", params);
  }

  public sendMany(
    transfers: Array<{ asset: H160 | string; value: bigint | number | string; address: string }>,
    from?: string,
    signers: Array<H160 | string> = []
  ): Promise<RelayTransactionResult> {
    const serializedTransfers = transfers.map((transfer) => ({
      asset: serializeTransferAsset(transfer.asset),
      value: serializeTransferValue(transfer.value),
      address: transfer.address
    }));

    const params: unknown[] = [];
    if (from !== undefined) {
      params.push(from);
    }
    params.push(serializedTransfers);
    if (signers.length > 0) {
      params.push(signers.map((signer) => serializeHash(signer)));
    }

    return this.send("sendmany", params);
  }

  public sendToAddress(
    assetId: H160 | string,
    to: string,
    amount: bigint | number | string
  ): Promise<RelayTransactionResult> {
    return this.send("sendtoaddress", [
      serializeTransferAsset(assetId),
      to,
      serializeTransferValue(amount)
    ]);
  }

  public submitBlock(block: Uint8Array | string | Base64Encodable): Promise<string> {
    return this.send<SubmitBlockResult>("submitblock", [encodeBinary(block)]).then((response) => response.hash);
  }

  public submit_block(block: Uint8Array | string | Base64Encodable): Promise<SubmitBlockResult> {
    return this.send("submitblock", [encodeBinary(block)]);
  }

  public validateAddress(address: string): Promise<boolean> {
    return this.send<ValidateAddressResult>("validateaddress", [address]).then((response) => response.isvalid);
  }

  public validate_address(address: string): Promise<ValidateAddressResult> {
    return this.send("validateaddress", [address]);
  }

  public cancelTx(txHash: H256 | string, signers: Array<H160 | string> = [], extraFee: bigint | number = 0): Promise<CancelTransactionResult> {
    return this.send("canceltx", [
      serializeHash(txHash),
      signers.map((signer) => serializeHash(signer)),
      BigInt(extraFee).toString()
    ]);
  }

  public cancel_tx(txHash: H256 | string, signers: Array<H160 | string> = [], extraFee: bigint | number = 0): Promise<CancelTransactionResult> {
    return this.cancelTx(txHash, signers, extraFee);
  }

  public cancelTransaction(
    txHash: H256 | string,
    signers: Array<H160 | string> = [],
    extraFee?: bigint | number | string
  ): Promise<CancelTransactionResult> {
    const params: unknown[] = [
      serializeHash(txHash),
      signers.map((signer) => serializeHash(signer))
    ];
    if (extraFee !== undefined) {
      params.push(typeof extraFee === "string" ? extraFee : BigInt(extraFee).toString());
    }
    return this.send("canceltransaction", params);
  }

  public calculateNetworkFee(tx: Tx | Uint8Array | string | Base64Encodable): Promise<string> {
    return this.send<NetworkFeeResult>("calculatenetworkfee", [encodeBinary(tx)]).then((response) => response.networkfee);
  }
}

export type { JsonRpcOptions, JsonRpcRequest, JsonRpcResponse, JsonRpcTransport, RpcClientOptions } from "./types.js";
