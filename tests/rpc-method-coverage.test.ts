import { describe, expect, it } from "vitest";
import { RpcClient } from "../src/index.js";

describe("rpc method coverage", () => {
  it("exposes the planned Neo N3 RPC surface", () => {
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => ({
        jsonrpc: "2.0",
        id: request.id,
        result: null
      })
    });

    const methods = [
      "send",
      "getBestBlockHash",
      "getBlock",
      "getBlockCount",
      "getBlockHeaderCount",
      "getBlockHash",
      "getBlockHeader",
      "getApplicationLog",
      "getConnectionCount",
      "getCommittee",
      "getContractState",
      "getNativeContracts",
      "getNep11Balances",
      "getNep11Properties",
      "getNep11Transfers",
      "getNep17Balances",
      "getNep17Transfers",
      "getNextBlockValidators",
      "getPeers",
      "getRawMemPool",
      "getRawTransaction",
      "getStateHeight",
      "getStorage",
      "findStorage",
      "getTransactionHeight",
      "getUnclaimedGas",
      "getUnspents",
      "getVersion",
      "invokeContractVerify",
      "invokeFunction",
      "invokeScript",
      "traverseIterator",
      "listPlugins",
      "sendTx",
      "submitBlock",
      "validateAddress",
      "cancelTx",
      "calculateNetworkFee"
    ];

    for (const method of methods) {
      expect(typeof (client as Record<string, unknown>)[method]).toBe("function");
    }
  });
});
