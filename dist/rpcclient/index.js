import { bytesToBase64, hexToBytes } from "../internal/bytes.js";
import { H256 } from "../core/hash.js";
import { Tx } from "../core/tx.js";
const DEFAULT_TIMEOUT_MS = 10_000;
export var RpcCode;
(function (RpcCode) {
    RpcCode[RpcCode["InvalidRequest"] = -32600] = "InvalidRequest";
    RpcCode[RpcCode["MethodNotFound"] = -32601] = "MethodNotFound";
    RpcCode[RpcCode["InvalidParams"] = -32602] = "InvalidParams";
    RpcCode[RpcCode["InternalError"] = -32603] = "InternalError";
    RpcCode[RpcCode["BadRequest"] = -32700] = "BadRequest";
    RpcCode[RpcCode["UnknownBlock"] = -101] = "UnknownBlock";
    RpcCode[RpcCode["UnknownContract"] = -102] = "UnknownContract";
    RpcCode[RpcCode["UnknownTransaction"] = -103] = "UnknownTransaction";
    RpcCode[RpcCode["UnknownStorageItem"] = -104] = "UnknownStorageItem";
    RpcCode[RpcCode["UnknownScriptContainer"] = -105] = "UnknownScriptContainer";
    RpcCode[RpcCode["UnknownStateRoot"] = -106] = "UnknownStateRoot";
    RpcCode[RpcCode["UnknownSession"] = -107] = "UnknownSession";
    RpcCode[RpcCode["UnknownIterator"] = -108] = "UnknownIterator";
    RpcCode[RpcCode["UnknownHeight"] = -109] = "UnknownHeight";
    RpcCode[RpcCode["InsufficientFundsWallet"] = -300] = "InsufficientFundsWallet";
    RpcCode[RpcCode["WalletFeeLimit"] = -301] = "WalletFeeLimit";
    RpcCode[RpcCode["NoOpenedWallet"] = -302] = "NoOpenedWallet";
    RpcCode[RpcCode["WalletNotFound"] = -303] = "WalletNotFound";
    RpcCode[RpcCode["WalletNotSupported"] = -304] = "WalletNotSupported";
    RpcCode[RpcCode["UnknownAccount"] = -305] = "UnknownAccount";
    RpcCode[RpcCode["VerificationFailed"] = -500] = "VerificationFailed";
    RpcCode[RpcCode["AlreadyExists"] = -501] = "AlreadyExists";
    RpcCode[RpcCode["MempoolCapacityReached"] = -502] = "MempoolCapacityReached";
    RpcCode[RpcCode["AlreadyInPool"] = -503] = "AlreadyInPool";
    RpcCode[RpcCode["InsufficientNetworkFee"] = -504] = "InsufficientNetworkFee";
    RpcCode[RpcCode["PolicyFailed"] = -505] = "PolicyFailed";
    RpcCode[RpcCode["InvalidScript"] = -506] = "InvalidScript";
    RpcCode[RpcCode["InvalidAttribute"] = -507] = "InvalidAttribute";
    RpcCode[RpcCode["InvalidSignature"] = -508] = "InvalidSignature";
    RpcCode[RpcCode["InvalidSize"] = -509] = "InvalidSize";
    RpcCode[RpcCode["ExpiredTransaction"] = -510] = "ExpiredTransaction";
    RpcCode[RpcCode["InsufficientFunds"] = -511] = "InsufficientFunds";
    RpcCode[RpcCode["InvalidContractVerification"] = -512] = "InvalidContractVerification";
    RpcCode[RpcCode["AccessDenied"] = -600] = "AccessDenied";
    RpcCode[RpcCode["SessionsDisabled"] = -601] = "SessionsDisabled";
    RpcCode[RpcCode["OracleDisabled"] = -602] = "OracleDisabled";
    RpcCode[RpcCode["OracleRequestFinished"] = -603] = "OracleRequestFinished";
    RpcCode[RpcCode["OracleRequestNotFound"] = -604] = "OracleRequestNotFound";
    RpcCode[RpcCode["OracleNotDesignatedNode"] = -605] = "OracleNotDesignatedNode";
    RpcCode[RpcCode["UnsupportedState"] = -606] = "UnsupportedState";
    RpcCode[RpcCode["InvalidProof"] = -607] = "InvalidProof";
    RpcCode[RpcCode["ExecutionFailed"] = -608] = "ExecutionFailed";
})(RpcCode || (RpcCode = {}));
export class JsonRpcError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = "JsonRpcError";
    }
    toString() {
        return `JsonRpcError{code:${this.code},message:${this.message}}`;
    }
}
async function defaultTransport(url, request, timeoutMs) {
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
        return (await response.json());
    }
    finally {
        clearTimeout(timeout);
    }
}
function normalizeEndpoints(endpoints) {
    return Array.isArray(endpoints) ? endpoints : [endpoints];
}
function serializeHash(value) {
    return typeof value === "string" ? value : value.toString();
}
function encodeBinary(value) {
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
function encodeStorageKey(value) {
    if (value instanceof Uint8Array) {
        return bytesToBase64(value);
    }
    return bytesToBase64(hexToBytes(value));
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeToJson(item) {
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
function serializeSigners(signers = []) {
    return signers.map(serializeToJson);
}
function serializeInvokeArgs(args) {
    return args.map(serializeToJson);
}
function serializeTransferValue(value) {
    return typeof value === "string" ? value : BigInt(value).toString();
}
export function mainnetEndpoints() {
    return [
        "http://seed1.neo.org:10332",
        "http://seed2.neo.org:10332",
        "http://seed3.neo.org:10332",
        "http://seed4.neo.org:10332",
        "http://seed5.neo.org:10332",
    ];
}
export function testnetEndpoints() {
    return [
        "http://seed1t5.neo.org:20332",
        "http://seed2t5.neo.org:20332",
        "http://seed3t5.neo.org:20332",
        "http://seed4t5.neo.org:20332",
        "http://seed5t5.neo.org:20332",
    ];
}
export class InvokeParameters {
    parameters = [];
    addAny() {
        this.parameters.push({ type: "Any" });
        return this;
    }
    addBool(value) {
        this.parameters.push({ type: "Boolean", value });
        return this;
    }
    addInteger(value) {
        this.parameters.push({ type: "Integer", value: BigInt(value).toString() });
        return this;
    }
    addHash160(value) {
        this.parameters.push({ type: "Hash160", value: serializeHash(value) });
        return this;
    }
    addHash256(value) {
        this.parameters.push({ type: "Hash256", value: serializeHash(value) });
        return this;
    }
    addPublicKey(value) {
        this.parameters.push({ type: "PublicKey", value: value.toString() });
        return this;
    }
    addString(value) {
        this.parameters.push({ type: "String", value });
        return this;
    }
    addSignature(value) {
        const encoded = typeof value === "string" ? value : bytesToBase64(value);
        this.parameters.push({ type: "Signature", value: encoded });
        return this;
    }
    addByteArray(value) {
        const encoded = typeof value === "string" ? value : bytesToBase64(value);
        this.parameters.push({ type: "ByteArray", value: encoded });
        return this;
    }
    toJSON() {
        return [...this.parameters];
    }
}
export class JsonRpc {
    endpoints;
    timeoutMs;
    transport;
    endpointStrategy;
    retryTransportErrors;
    nextId = 1;
    nextEndpointIndex = 0;
    constructor(endpoints, options = {}) {
        this.endpoints = normalizeEndpoints(endpoints);
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.transport = options.transport ?? defaultTransport;
        this.endpointStrategy = options.endpointStrategy ?? "first";
        this.retryTransportErrors = options.retryTransportErrors ?? false;
    }
    async send(method, params = []) {
        if (this.endpoints.length === 0) {
            throw new JsonRpcError(RpcCode.BadRequest, "no RPC endpoints configured");
        }
        const request = {
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
        let lastTransportError = null;
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
                return response.result;
            }
            catch (error) {
                if (error instanceof JsonRpcError) {
                    throw error;
                }
                lastTransportError = new JsonRpcError(RpcCode.InternalError, error instanceof Error ? error.message : String(error));
                if (!this.retryTransportErrors) {
                    break;
                }
            }
        }
        throw lastTransportError ?? new JsonRpcError(RpcCode.InternalError, "RPC request failed");
    }
}
export class RpcClient {
    jsonrpc;
    constructor(endpoints = [], options = {}) {
        this.jsonrpc = options.jsonrpc ?? new JsonRpc(endpoints, options);
    }
    async send(method, params = []) {
        return this.jsonrpc.send(method, params);
    }
    callNoParams(method) {
        return this.send(method);
    }
    callSingleParam(method, param) {
        return this.send(method, [param]);
    }
    callHashParam(method, value) {
        return this.callSingleParam(method, serializeHash(value));
    }
    callWithBooleanArg(method, param, flag = 0) {
        return this.send(method, [param, flag]);
    }
    callEncodedPayload(method, payload) {
        return this.callSingleParam(method, encodeBinary(payload));
    }
    callAccountTimeRange(method, account, startTime, endTime) {
        const params = [account];
        if (startTime !== undefined || endTime !== undefined) {
            params.push(startTime ?? "");
        }
        if (endTime !== undefined) {
            params.push(endTime);
        }
        return this.send(method, params);
    }
    callStorageLookup(method, scriptHash, key) {
        return this.send(method, [serializeHash(scriptHash), encodeStorageKey(key)]);
    }
    serializeInvokeInput(args) {
        if (args === undefined) {
            return [];
        }
        return Array.isArray(args) ? serializeInvokeArgs(args) : args.toJSON();
    }
    serializeSignerInput(signers) {
        return serializeSigners(signers ?? []);
    }
    getBestBlockHash() {
        return this.callNoParams("getbestblockhash");
    }
    getBlock(input) {
        return this.callWithBooleanArg("getblock", input.indexOrHash, input.verbose ?? 0);
    }
    getBlockCount() {
        return this.callNoParams("getblockcount");
    }
    getBlockHeaderCount() {
        return this.callNoParams("getblockheadercount");
    }
    getBlockHash(input) {
        return this.callSingleParam("getblockhash", input.blockIndex);
    }
    getBlockHeader(input) {
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
        return this.callWithBooleanArg("getblockheader", blockHash ?? height ?? indexOrHash, resolvedVerbose);
    }
    getApplicationLog(input) {
        const params = [serializeHash(input.hash)];
        if (input.trigger !== undefined) {
            params.push(input.trigger);
        }
        return this.send("getapplicationlog", params);
    }
    getCandidates() {
        return this.callNoParams("getcandidates");
    }
    getCommittee() {
        return this.callNoParams("getcommittee");
    }
    getConnectionCount() {
        return this.callNoParams("getconnectioncount");
    }
    getContractState(input) {
        return this.callHashParam("getcontractstate", input.scriptHash);
    }
    getNativeContracts() {
        return this.callNoParams("getnativecontracts");
    }
    getNep11Balances(input) {
        return this.callSingleParam("getnep11balances", input.account);
    }
    getNep11Properties(input) {
        return this.send("getnep11properties", [serializeHash(input.contractHash), input.tokenId]);
    }
    getNep11Transfers(input) {
        return this.callAccountTimeRange("getnep11transfers", input.account, input.startTime, input.endTime);
    }
    getNep17Balances(input) {
        return this.callSingleParam("getnep17balances", input.account);
    }
    getNep17Transfers(input) {
        return this.callAccountTimeRange("getnep17transfers", input.account, input.startTime, input.endTime);
    }
    getNextBlockValidators() {
        return this.callNoParams("getnextblockvalidators");
    }
    getPeers() {
        return this.callNoParams("getpeers");
    }
    getRawMemPool(includeUnverified = 0) {
        return this.callSingleParam("getrawmempool", includeUnverified);
    }
    getRawTransaction(input) {
        return this.callWithBooleanArg("getrawtransaction", serializeHash(input.hash), input.verbose ?? 0);
    }
    getStateHeight() {
        return this.callNoParams("getstateheight");
    }
    getStateRoot(input) {
        return this.callSingleParam("getstateroot", input.index);
    }
    getProof(input) {
        return this.send("getproof", [
            serializeHash(input.rootHash),
            serializeHash(input.contractHash),
            encodeStorageKey(input.key),
        ]);
    }
    verifyProof(input) {
        return this.send("verifyproof", [serializeHash(input.rootHash), encodeStorageKey(input.proof)]);
    }
    getState(input) {
        return this.send("getstate", [
            serializeHash(input.rootHash),
            serializeHash(input.contractHash),
            encodeStorageKey(input.key),
        ]);
    }
    getStorage(input) {
        return this.callStorageLookup("getstorage", input.scriptHash, input.key);
    }
    findStorage(input) {
        return this.send("findstorage", [
            serializeHash(input.scriptHash),
            encodeStorageKey(input.prefix),
            input.start ?? 0,
        ]);
    }
    findStates(input) {
        const params = [
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
    getTransactionHeight(input) {
        return this.callHashParam("gettransactionheight", input.hash);
    }
    getUnclaimedGas(input) {
        return this.callSingleParam("getunclaimedgas", input.address);
    }
    getUnspents(input) {
        return this.callSingleParam("getunspents", input.address);
    }
    getVersion() {
        return this.callNoParams("getversion");
    }
    openWallet(input) {
        return this.send("openwallet", [input.path, input.password]);
    }
    closeWallet() {
        return this.callNoParams("closewallet");
    }
    dumpPrivKey(input) {
        return this.callSingleParam("dumpprivkey", input.address);
    }
    getNewAddress() {
        return this.callNoParams("getnewaddress");
    }
    getWalletBalance(input) {
        return this.callHashParam("getwalletbalance", input.assetId);
    }
    getWalletUnclaimedGas() {
        return this.callNoParams("getwalletunclaimedgas");
    }
    importPrivKey(input) {
        return this.callSingleParam("importprivkey", input.wif);
    }
    listAddress() {
        return this.callNoParams("listaddress");
    }
    invokeFunction(input) {
        const serializedArgs = this.serializeInvokeInput(input.args);
        return this.send("invokefunction", [
            serializeHash(input.contractHash),
            input.method,
            serializedArgs,
            this.serializeSignerInput(input.signers),
        ]);
    }
    invokeContractVerify(input) {
        const serializedArgs = this.serializeInvokeInput(input.args);
        return this.send("invokecontractverify", [
            serializeHash(input.contractHash),
            serializedArgs,
            this.serializeSignerInput(input.signers),
        ]);
    }
    invokeScript(input) {
        return this.send("invokescript", [encodeBinary(input.script), this.serializeSignerInput(input.signers)]);
    }
    traverseIterator(input) {
        return this.send("traverseiterator", [input.sessionId, input.iteratorId, input.count]);
    }
    terminateSession(input) {
        return this.callSingleParam("terminatesession", input.sessionId);
    }
    listPlugins() {
        return this.callNoParams("listplugins");
    }
    sendRawTransaction(input) {
        return this.callEncodedPayload("sendrawtransaction", input.tx);
    }
    sendFrom(input) {
        const params = [
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
    sendMany(input) {
        const serializedTransfers = input.transfers.map((transfer) => ({
            asset: serializeHash(transfer.asset),
            value: serializeTransferValue(transfer.value),
            address: transfer.address,
        }));
        const params = [];
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
    sendToAddress(input) {
        return this.send("sendtoaddress", [serializeHash(input.assetId), input.to, serializeTransferValue(input.amount)]);
    }
    submitBlock(input) {
        return this.callEncodedPayload("submitblock", input.block);
    }
    validateAddress(input) {
        return this.callSingleParam("validateaddress", input.address);
    }
    cancelTransaction(input) {
        const params = [
            serializeHash(input.txHash),
            (input.signers ?? []).map((signer) => serializeHash(signer)),
        ];
        if (input.extraFee !== undefined) {
            params.push(typeof input.extraFee === "string" ? input.extraFee : BigInt(input.extraFee).toString());
        }
        return this.send("canceltransaction", params);
    }
    calculateNetworkFee(input) {
        return this.callEncodedPayload("calculatenetworkfee", input.tx);
    }
}
