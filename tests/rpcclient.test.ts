import { describe, expect, it } from "vitest";
import {
  H160,
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
  gasContractHash,
  testNetworkId
} from "../src/index.js";

describe("rpcclient", () => {
  it("builds invoke parameters with Neo stack item JSON", () => {
    const privateKey = new PrivateKey(
      "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
    );
    const args = new InvokeParameters()
      .addString("hello")
      .addInteger(42)
      .addHash160(gasContractHash())
      .addPublicKey(privateKey.publicKey());

    expect(args.toJSON()).toEqual([
      { type: "String", value: "hello" },
      { type: "Integer", value: "42" },
      { type: "Hash160", value: "0xd2a4cff31913016155e38e474a2c06d08be276cf" },
      {
        type: "PublicKey",
        value: privateKey.publicKey().toString()
      }
    ]);
  });

  it("maps transport errors into JsonRpcError", async () => {
    const jsonrpc = new JsonRpc("http://localhost:10332", {
      transport: async () => ({
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: RpcCode.MethodNotFound,
          message: "missing"
        }
      })
    });

    await expect(jsonrpc.send("missing")).rejects.toEqual(
      new JsonRpcError(RpcCode.MethodNotFound, "missing")
    );
  });

  it("fails clearly when no rpc endpoints are configured", async () => {
    const jsonrpc = new JsonRpc([], {
      transport: async () => {
        throw new Error("should not be called");
      }
    });

    await expect(jsonrpc.send("ping")).rejects.toEqual(
      new JsonRpcError(RpcCode.BadRequest, "no RPC endpoints configured")
    );
  });

  it("serializes Python-parity rpc methods correctly", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: { ok: true }
        };
      }
    });

    const privateKey = new PrivateKey(
      "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
    );
    const tx = new Tx({
      nonce: 1,
      systemFee: 1n,
      networkFee: 2n,
      validUntilBlock: 3,
      script: new ScriptBuilder().emitPush("ping").toBytes(),
      signers: [
        new Signer({
          account: privateKey.publicKey().getScriptHash(),
          scopes: WitnessScope.CalledByEntry
        })
      ]
    });
    tx.witnesses = [privateKey.signWitness(tx.getSignData(testNetworkId()))];

    const signers = [
      new Signer({
        account: privateKey.publicKey().getScriptHash(),
        scopes: WitnessScope.CalledByEntry
      })
    ];

    await client.getBestBlockHash();
    await client.getBlockCount();
    await client.getBlockHeaderCount();
    await client.getBlockHash(42);
    await client.getBlockHeader(42, true);
    await client.invokeFunction(
      gasContractHash(),
      "symbol",
      new InvokeParameters().addString("neo"),
      signers
    );
    await client.sendTx(tx);
    await client.getConnectionCount();
    await client.getPeers();
    await client.getVersion();
    await client.submitBlock(new Uint8Array([1, 2, 3]));
    await client.listPlugins();
    await client.validateAddress("Ndz7d2xQ8d7d2xQ8d7d2xQ8d7d2xQ8d7d2");
    await client.cancelTx(
      new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf").toString().replace("0x", "0x000000000000000000000000"),
      [privateKey.publicKey().getScriptHash()],
      99n
    );
    await client.getStorage(gasContractHash(), "010203");
    await client.findStorage(gasContractHash(), "0a0b", 5);
    await client.invokeContractVerify(
      gasContractHash(),
      new InvokeParameters().addString("neo"),
      signers
    );

    expect(requests.map((request) => request.method)).toEqual([
      "getbestblockhash",
      "getblockcount",
      "getblockheadercount",
      "getblockhash",
      "getblockheader",
      "invokefunction",
      "sendrawtransaction",
      "getconnectioncount",
      "getpeers",
      "getversion",
      "submitblock",
      "listplugins",
      "validateaddress",
      "canceltx",
      "getstorage",
      "findstorage",
      "invokecontractverify"
    ]);

    expect(requests[4]).toEqual({
      method: "getblockheader",
      params: [42, true]
    });
    expect(requests[5]).toEqual({
      method: "invokefunction",
      params: [
        "0xd2a4cff31913016155e38e474a2c06d08be276cf",
        "symbol",
        [{ type: "String", value: "neo" }],
        [signers[0].toJSON()]
      ]
    });
    expect(requests[6].params[0]).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(requests[10]).toEqual({
      method: "submitblock",
      params: ["AQID"]
    });
    expect(requests[13]).toEqual({
      method: "canceltx",
      params: [
        "0x000000000000000000000000d2a4cff31913016155e38e474a2c06d08be276cf",
        [privateKey.publicKey().getScriptHash().toString()],
        "99"
      ]
    });
    expect(requests[14]).toEqual({
      method: "getstorage",
      params: ["0xd2a4cff31913016155e38e474a2c06d08be276cf", "AQID"]
    });
    expect(requests[15]).toEqual({
      method: "findstorage",
      params: ["0xd2a4cff31913016155e38e474a2c06d08be276cf", "Cgs=", 5]
    });
    expect(requests[16]).toEqual({
      method: "invokecontractverify",
      params: [
        "0xd2a4cff31913016155e38e474a2c06d08be276cf",
        [{ type: "String", value: "neo" }],
        [signers[0].toJSON()]
      ]
    });
  });
});
