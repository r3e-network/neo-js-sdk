import { sc, u } from "@cityofzion/neon-core";
import { describe, expect, it } from "vitest";
import {
  H160,
  H256,
  InvokeParameters,
  JsonRpc,
  JsonRpcError,
  PrivateKey,
  RpcClient,
  RpcCode,
  ScriptBuilder,
  Signer,
  Tx,
  WitnessScope,
  bytesToBase64,
  gasContractHash,
  testNetworkId,
} from "../src/index.js";

const GAS = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
const TEST_KEY = "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6";

function createClient(handler?: (method: string, params: unknown[]) => unknown) {
  const requests: Array<{ method: string; params: unknown[] }> = [];
  const transport = async (_url: string, request: { id: number; method: string; params: unknown[] }) => {
    requests.push({ method: request.method, params: request.params });
    const result = handler?.(request.method, request.params) ?? null;
    return { jsonrpc: "2.0" as const, id: request.id, result };
  };
  const client = new RpcClient("http://localhost:10332", { transport });
  return { client, requests };
}

/* --- InvokeParameters ---------------------------------------------------- */

describe("InvokeParameters", () => {
  it("builds Neo stack item JSON", () => {
    const pk = new PrivateKey(TEST_KEY);
    const args = new InvokeParameters()
      .addString("hello")
      .addInteger(42)
      .addHash160(gasContractHash())
      .addPublicKey(pk.publicKey());

    expect(args.toJSON()).toEqual([
      { type: "String", value: "hello" },
      { type: "Integer", value: "42" },
      { type: "Hash160", value: GAS },
      { type: "PublicKey", value: pk.publicKey().toString() },
    ]);
  });
});

/* --- JsonRpc transport --------------------------------------------------- */

describe("JsonRpc transport", () => {
  it("maps RPC error responses into JsonRpcError", async () => {
    const jsonrpc = new JsonRpc("http://localhost:10332", {
      transport: async () => ({
        jsonrpc: "2.0" as const, id: 1,
        error: { code: RpcCode.MethodNotFound, message: "missing" },
      }),
    });
    await expect(jsonrpc.send("missing")).rejects.toEqual(
      new JsonRpcError(RpcCode.MethodNotFound, "missing"),
    );
  });

  it("wraps non-Error transport failures as JsonRpcError", async () => {
    const jsonrpc = new JsonRpc("http://localhost:10332", {
      transport: async () => { throw "string failure"; },
    });
    await expect(jsonrpc.send("test")).rejects.toMatchObject({
      code: RpcCode.InternalError, message: "string failure",
    });
  });

  it("fails when no rpc endpoints are configured", async () => {
    const jsonrpc = new JsonRpc([], {
      transport: async () => { throw new Error("unreachable"); },
    });
    await expect(jsonrpc.send("ping")).rejects.toEqual(
      new JsonRpcError(RpcCode.BadRequest, "no RPC endpoints configured"),
    );
  });

  it("handles response missing result field", async () => {
    const jsonrpc = new JsonRpc("http://localhost:10332", {
      transport: async () => ({ jsonrpc: "2.0", id: 1 }) as never,
    });
    await expect(jsonrpc.send("test")).rejects.toMatchObject({
      code: RpcCode.InvalidRequest, message: "response missing result",
    });
  });

  it("handles malformed error response", async () => {
    const jsonrpc = new JsonRpc("http://localhost:10332", {
      transport: async () => ({ jsonrpc: "2.0", id: 1, error: {} }) as never,
    });
    await expect(jsonrpc.send("test")).rejects.toBeInstanceOf(JsonRpcError);
  });

  it("round-robins across multiple endpoints", async () => {
    let n = 0;
    const jsonrpc = new JsonRpc(["http://node1:10332", "http://node2:10332"], {
      transport: async (url) => ({ jsonrpc: "2.0" as const, id: ++n, result: url }),
      endpointStrategy: "round-robin",
    });
    expect(await jsonrpc.send("a")).not.toBe(await jsonrpc.send("b"));
  });

  it("keeps JsonRpcError string formatting stable", () => {
    expect(new JsonRpcError(RpcCode.BadRequest, "bad").toString()).toBe(
      "JsonRpcError{code:-32700,message:bad}",
    );
  });
});

/* --- Core RPC method serialization --------------------------------------- */

describe("RPC method serialization", () => {
  it("serializes the canonical rpc methods correctly", async () => {
    const { client, requests } = createClient();
    const pk = new PrivateKey(TEST_KEY);
    const tx = new Tx({
      nonce: 1, systemFee: 1n, networkFee: 2n, validUntilBlock: 3,
      script: new ScriptBuilder().emitPush("ping").toBytes(),
      signers: [new Signer({ account: pk.publicKey().getScriptHash(), scopes: WitnessScope.CalledByEntry })],
    });
    tx.witnesses = [pk.signWitness(tx.getSignData(testNetworkId()))];
    const signers = [new Signer({ account: pk.publicKey().getScriptHash(), scopes: WitnessScope.CalledByEntry })];

    await client.getBestBlockHash();
    await client.getBlockCount();
    await client.getBlockHeaderCount();
    await client.getBlockHash({ blockIndex: 42 });
    await client.getBlockHeader({ indexOrHash: 42, verbose: true });
    await client.invokeFunction({
      contractHash: gasContractHash(), method: "symbol",
      args: new InvokeParameters().addString("neo"), signers,
    });
    await client.sendRawTransaction({ tx });
    await client.getConnectionCount();
    await client.getPeers();
    await client.getVersion();
    await client.submitBlock({ block: new Uint8Array([1, 2, 3]) });
    await client.listPlugins();
    await client.validateAddress({ address: "Ndz7d2xQ8d7d2xQ8d7d2xQ8d7d2xQ8d7d2" });
    await client.cancelTransaction({
      txHash: new H160(GAS).toString().replace("0x", "0x000000000000000000000000"),
      signers: [pk.publicKey().getScriptHash()], extraFee: 99n,
    });
    await client.getStorage({ scriptHash: gasContractHash(), key: "010203" });
    await client.findStorage({ scriptHash: gasContractHash(), prefix: "0a0b", start: 5 });
    await client.invokeContractVerify({
      contractHash: gasContractHash(),
      args: new InvokeParameters().addString("neo"), signers,
    });

    expect(requests.map((r) => r.method)).toEqual([
      "getbestblockhash", "getblockcount", "getblockheadercount", "getblockhash",
      "getblockheader", "invokefunction", "sendrawtransaction", "getconnectioncount",
      "getpeers", "getversion", "submitblock", "listplugins", "validateaddress",
      "canceltransaction", "getstorage", "findstorage", "invokecontractverify",
    ]);

    expect(requests[4]).toEqual({ method: "getblockheader", params: [42, true] });
    expect(requests[5]).toEqual({
      method: "invokefunction",
      params: [GAS, "symbol", [{ type: "String", value: "neo" }], [signers[0].toJSON()]],
    });
    expect(requests[6].params[0]).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(requests[10]).toEqual({ method: "submitblock", params: ["AQID"] });
    expect(requests[14]).toEqual({ method: "getstorage", params: [GAS, "AQID"] });
    expect(requests[15]).toEqual({ method: "findstorage", params: [GAS, "Cgs=", 5] });
    expect(requests[16]).toEqual({
      method: "invokecontractverify",
      params: [GAS, [{ type: "String", value: "neo" }], [signers[0].toJSON()]],
    });
  });
});

/* --- Return shapes and neon-js compatibility ----------------------------- */

describe("RPC return shapes", () => {
  it("matches convenience return shapes", async () => {
    const { client, requests } = createClient((m) => {
      const map: Record<string, unknown> = {
        getblock: "raw-block", getblockheader: "raw-header", getrawtransaction: "raw-tx",
        sendrawtransaction: { hash: "0xtx" }, submitblock: { hash: "0xblock" },
        getunclaimedgas: { unclaimed: "123", address: "N" },
        validateaddress: { address: "N", isvalid: true },
        calculatenetworkfee: { networkfee: "456" },
      };
      return map[m] ?? null;
    });

    await expect(client.getBlock({ indexOrHash: "0xabc" })).resolves.toBe("raw-block");
    await expect(client.getBlockHeader({ indexOrHash: "0xabc" })).resolves.toBe("raw-header");
    await expect(client.getRawTransaction({ hash: "0xabc" })).resolves.toBe("raw-tx");
    await expect(client.sendRawTransaction({ tx: "AQID" })).resolves.toEqual({ hash: "0xtx" });
    await expect(client.submitBlock({ block: "AQID" })).resolves.toEqual({ hash: "0xblock" });
    await expect(client.getUnclaimedGas({ address: "N" })).resolves.toEqual({ unclaimed: "123", address: "N" });
    await expect(client.validateAddress({ address: "N" })).resolves.toEqual({ address: "N", isvalid: true });
    await expect(client.calculateNetworkFee({ tx: "AQID" })).resolves.toEqual({ networkfee: "456" });

    expect(requests).toEqual([
      { method: "getblock", params: ["0xabc", 0] },
      { method: "getblockheader", params: ["0xabc", 0] },
      { method: "getrawtransaction", params: ["0xabc", 0] },
      { method: "sendrawtransaction", params: ["AQID"] },
      { method: "submitblock", params: ["AQID"] },
      { method: "getunclaimedgas", params: ["N"] },
      { method: "validateaddress", params: ["N"] },
      { method: "calculatenetworkfee", params: ["AQID"] },
    ]);
  });

  it("accepts neon-style boolean-like params and raw mempool default", async () => {
    const { client, requests } = createClient(() => []);

    await client.getBlock({ indexOrHash: "0xabc", verbose: 1 as never });
    await client.getBlockHeader({ indexOrHash: "0xabc", verbose: 0 as never });
    await client.getRawTransaction({ hash: "0xabc", verbose: 1 as never });
    await client.getRawMemPool();
    await client.getRawMemPool(1 as never);

    expect(requests).toEqual([
      { method: "getblock", params: ["0xabc", 1] },
      { method: "getblockheader", params: ["0xabc", 0] },
      { method: "getrawtransaction", params: ["0xabc", 1] },
      { method: "getrawmempool", params: [0] },
      { method: "getrawmempool", params: [1] },
    ]);
  });

  it("accepts plain signer json objects like neon-js", async () => {
    const signer = new Signer({
      account: new PrivateKey(TEST_KEY).publicKey().getScriptHash(),
      scopes: WitnessScope.CalledByEntry,
    }).toJSON();

    const { client, requests } = createClient(() => ({
      state: "HALT", stack: [], gasconsumed: "0", script: "",
    }));

    await client.invokeFunction({
      contractHash: gasContractHash(), method: "symbol",
      args: [{ type: "String", value: "neo" }], signers: [signer as never],
    });
    await client.invokeContractVerify({
      contractHash: gasContractHash(),
      args: [{ type: "String", value: "neo" }], signers: [signer as never],
    });
    await client.invokeScript({ script: "AQID", signers: [signer as never] });

    expect(requests).toEqual([
      { method: "invokefunction", params: [GAS, "symbol", [{ type: "String", value: "neo" }], [signer]] },
      { method: "invokecontractverify", params: [GAS, [{ type: "String", value: "neo" }], [signer]] },
      { method: "invokescript", params: ["AQID", [signer]] },
    ]);
  });

  it("accepts neon-js HexString and ContractParam inputs", async () => {
    const { client, requests } = createClient(() => ({
      hash: "0xtx", state: "HALT", stack: [], gasconsumed: "0", script: "",
    }));

    const hexScript = u.HexString.fromHex("010203");
    const cparams = [sc.ContractParam.string("neo"), sc.ContractParam.integer(42)];

    await client.invokeFunction({ contractHash: gasContractHash(), method: "symbol", args: cparams });
    await client.invokeContractVerify({ contractHash: gasContractHash(), args: cparams });
    await client.invokeScript({ script: hexScript });
    await client.sendRawTransaction({ tx: hexScript });
    await client.submitBlock({ block: hexScript });
    await client.calculateNetworkFee({ tx: hexScript });

    expect(requests).toEqual([
      { method: "invokefunction", params: [GAS, "symbol", [{ type: "String", value: "neo" }, { type: "Integer", value: "42" }], []] },
      { method: "invokecontractverify", params: [GAS, [{ type: "String", value: "neo" }, { type: "Integer", value: "42" }], []] },
      { method: "invokescript", params: ["AQID", []] },
      { method: "sendrawtransaction", params: ["AQID"] },
      { method: "submitblock", params: ["AQID"] },
      { method: "calculatenetworkfee", params: ["AQID"] },
    ]);
  });
});

/* --- Extended RPC wrappers ----------------------------------------------- */

describe("extended RPC wrappers", () => {
  it("covers direct wrappers with typed return values", async () => {
    const { client, requests } = createClient((m) => {
      const map: Record<string, unknown> = {
        getapplicationlog: { executions: [] }, getcommittee: ["03abcdef"],
        getrawmempool: { height: 1, verified: [], unverified: [] },
        getstateheight: { localrootindex: 1, validatedrootindex: 2 },
        getproof: "AQI=", verifyproof: "AQI=", getstate: "AQI=", getstorage: "AQI=",
        findstates: { truncated: false, results: [] }, gettransactionheight: 99,
        getcandidates: [], getnextblockvalidators: [],
      };
      return map[m] ?? null;
    });

    await expect(client.getApplicationLog({ hash: "0xabc", trigger: "Application" })).resolves.toEqual({ executions: [] });
    await expect(client.getCommittee()).resolves.toEqual(["03abcdef"]);
    await expect(client.getRawMemPool(true)).resolves.toEqual({ height: 1, verified: [], unverified: [] });
    await expect(client.getStateHeight()).resolves.toEqual({ localrootindex: 1, validatedrootindex: 2 });
    await expect(client.getProof({ rootHash: "0xabc", contractHash: new H160(), key: "0102" })).resolves.toBe("AQI=");
    await expect(client.verifyProof({ rootHash: "0xabc", proof: "0102" })).resolves.toBe("AQI=");
    await expect(client.getState({ rootHash: "0xabc", contractHash: new H160(), key: "0102" })).resolves.toBe("AQI=");
    await expect(client.getStorage({ scriptHash: new H160(), key: "0102" })).resolves.toBe("AQI=");
    await expect(client.findStates({ rootHash: "0xabc", contractHash: new H160(), prefix: "0102" })).resolves.toEqual({ truncated: false, results: [] });
    await expect(client.getTransactionHeight({ hash: new H256() })).resolves.toBe(99);
    await expect(client.getCandidates()).resolves.toEqual([]);
    await expect(client.getNextBlockValidators()).resolves.toEqual([]);

    expect(requests.map((r) => r.method)).toEqual([
      "getapplicationlog", "getcommittee", "getrawmempool", "getstateheight",
      "getproof", "verifyproof", "getstate", "getstorage", "findstates",
      "gettransactionheight", "getcandidates", "getnextblockvalidators",
    ]);
  });

  it("covers NEP-17/11 balance and transfer params", async () => {
    const { client, requests } = createClient(() => ({}));

    await client.getContractState({ scriptHash: gasContractHash() });
    await client.getNativeContracts();
    await client.getStateRoot({ index: 1 });
    await client.getNep17Balances({ account: "NAddr1" });
    await client.getNep11Balances({ account: "NAddr1" });
    await client.getNep17Transfers({ account: "NAddr1" });
    await client.getNep17Transfers({ account: "NAddr1", startTime: "2024-01-01" });
    await client.getNep11Transfers({ account: "NAddr1", startTime: "2024-01-01", endTime: "2024-12-31" });

    expect(requests.map((r) => r.method)).toEqual([
      "getcontractstate", "getnativecontracts", "getstateroot",
      "getnep17balances", "getnep11balances",
      "getnep17transfers", "getnep17transfers", "getnep11transfers",
    ]);
    expect(requests[5].params).toEqual(["NAddr1"]);
    expect(requests[6].params).toEqual(["NAddr1", "2024-01-01"]);
    expect(requests[7].params).toEqual(["NAddr1", "2024-01-01", "2024-12-31"]);
  });

  it("covers sendFrom/sendMany/sendToAddress without optional signers", async () => {
    const { client, requests } = createClient(() => ({ hash: "0xtx" }));

    await client.sendFrom({ assetId: gasContractHash(), from: "NAddr1", to: "NAddr2", amount: "100" });
    await client.sendMany({ transfers: [{ asset: gasContractHash(), value: "50", address: "NAddr1" }] });
    await client.sendToAddress({ assetId: gasContractHash(), to: "NAddr1", amount: 100n });

    expect(requests[0].method).toBe("sendfrom");
    expect(requests[0].params).toHaveLength(4);
    expect(requests[1].method).toBe("sendmany");
    expect(requests[2].method).toBe("sendtoaddress");
  });
});

/* --- State-service & wallet-node methods --------------------------------- */

describe("state-service and wallet-node RPC methods", () => {
  it("serializes state-service payload encoding", async () => {
    const { client, requests } = createClient();

    await client.getCandidates();
    await client.getStateRoot({ index: 123 });
    await client.getApplicationLog({
      hash: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      trigger: "Application",
    });
    await client.getProof({
      rootHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      contractHash: gasContractHash(), key: "010203",
    });
    await client.verifyProof({
      rootHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      proof: "deadbeef",
    });
    await client.getState({
      rootHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      contractHash: gasContractHash(), key: "f00d",
    });
    await client.findStates({
      rootHash: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      contractHash: gasContractHash(), prefix: "0a0b", count: 10,
    });
    await client.findStates({
      rootHash: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      contractHash: gasContractHash(),
      prefix: new Uint8Array([0x01, 0x02]), from: new Uint8Array([0x03, 0x04]), count: 5,
    });
    await client.terminateSession({ sessionId: "550e8400-e29b-41d4-a716-446655440000" });

    expect(requests).toEqual([
      { method: "getcandidates", params: [] },
      { method: "getstateroot", params: [123] },
      { method: "getapplicationlog", params: ["0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", "Application"] },
      { method: "getproof", params: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", GAS, "AQID"] },
      { method: "verifyproof", params: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", bytesToBase64(Buffer.from("deadbeef", "hex"))] },
      { method: "getstate", params: ["0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc", GAS, bytesToBase64(Buffer.from("f00d", "hex"))] },
      { method: "findstates", params: ["0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", GAS, "Cgs=", "", 10] },
      { method: "findstates", params: ["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", GAS, "AQI=", "AwQ=", 5] },
      { method: "terminatesession", params: ["550e8400-e29b-41d4-a716-446655440000"] },
    ]);
  });

  it("serializes wallet-node methods with official parameter order", async () => {
    const { client, requests } = createClient((m) =>
      m === "sendrawtransaction" ? { hash: "0xtx" } : { hash: "0xrelay" },
    );

    const asset = gasContractHash();
    const from = "Ndz7d2xQ8d7d2xQ8d7d2xQ8d7d2xQ8d7d2";
    const to = "NbTiM6h8r99kpRtb428XcsUk1TzKed2gTc";
    const signers = [gasContractHash()];
    const transfers = [
      { asset, value: 1, address: to },
      { asset: asset.toString(), value: "2.5", address: from },
    ];

    await client.openWallet({ path: "/tmp/test.wallet.json", password: "secret" });
    await client.closeWallet();
    await client.dumpPrivKey({ address: from });
    await client.getNewAddress();
    await client.getWalletBalance({ assetId: asset });
    await client.getWalletUnclaimedGas();
    await client.importPrivKey({ wif: "L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g" });
    await client.listAddress();
    await client.sendFrom({ assetId: asset, from, to, amount: 42, signers });
    await client.sendMany({ transfers });
    await client.sendMany({ transfers, from, signers });
    await client.sendToAddress({ assetId: asset, to, amount: "7.25" });
    await client.cancelTransaction({
      txHash: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      signers, extraFee: "0.5",
    });
    await client.sendRawTransaction({ tx: new Uint8Array([1, 2, 3]) });

    expect(requests).toEqual([
      { method: "openwallet", params: ["/tmp/test.wallet.json", "secret"] },
      { method: "closewallet", params: [] },
      { method: "dumpprivkey", params: [from] },
      { method: "getnewaddress", params: [] },
      { method: "getwalletbalance", params: [GAS] },
      { method: "getwalletunclaimedgas", params: [] },
      { method: "importprivkey", params: ["L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g"] },
      { method: "listaddress", params: [] },
      { method: "sendfrom", params: [GAS, from, to, "42", [GAS]] },
      { method: "sendmany", params: [[{ asset: GAS, value: "1", address: to }, { asset: GAS, value: "2.5", address: from }]] },
      { method: "sendmany", params: [from, [{ asset: GAS, value: "1", address: to }, { asset: GAS, value: "2.5", address: from }], [GAS]] },
      { method: "sendtoaddress", params: [GAS, to, "7.25"] },
      { method: "canceltransaction", params: ["0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", [GAS], "0.5"] },
      { method: "sendrawtransaction", params: ["AQID"] },
    ]);
  });
});
