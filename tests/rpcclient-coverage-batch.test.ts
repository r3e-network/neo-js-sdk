import { describe, expect, it } from "vitest";
import { H160, H256, RpcClient, WitnessScope } from "../src/index.js";

describe("rpcclient coverage batch", () => {
  it("covers additional direct wrappers and python-style aliases", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        switch (request.method) {
          case "getapplicationlog":
            return { jsonrpc: "2.0", id: request.id, result: { executions: [] } };
          case "getcommittee":
            return { jsonrpc: "2.0", id: request.id, result: ["03abcdef"] };
          case "getrawmempool":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { height: 1, verified: [], unverified: [] }
            };
          case "getstateheight":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { localrootindex: 1, validatedrootindex: 2 }
            };
          case "getproof":
          case "verifyproof":
          case "getstate":
          case "getstorage":
            return { jsonrpc: "2.0", id: request.id, result: "AQI=" };
          case "findstates":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { truncated: false, results: [] }
            };
          case "gettransactionheight":
            return { jsonrpc: "2.0", id: request.id, result: 99 };
          case "getcandidates":
          case "getnextblockvalidators":
            return { jsonrpc: "2.0", id: request.id, result: [] };
          default:
            return { jsonrpc: "2.0", id: request.id, result: null };
        }
      }
    });

    await expect(client.getApplicationLog("0xabc", "Application")).resolves.toEqual({ executions: [] });
    await expect(client.get_application_log("0xdef")).resolves.toEqual({ executions: [] });
    await expect(client.getCommittee()).resolves.toEqual(["03abcdef"]);
    await expect(client.getRawMemPool(true)).resolves.toEqual({ height: 1, verified: [], unverified: [] });
    await expect(client.getStateHeight()).resolves.toEqual({ localrootindex: 1, validatedrootindex: 2 });
    await expect(client.getProof("0xabc", new H160(), "0102")).resolves.toBe("AQI=");
    await expect(client.verifyProof("0xabc", "0102")).resolves.toBe("AQI=");
    await expect(client.getState("0xabc", new H160(), "0102")).resolves.toBe("AQI=");
    await expect(client.getStorage(new H160(), "0102")).resolves.toBe("AQI=");
    await expect(client.findStates("0xabc", new H160(), "0102")).resolves.toEqual({ truncated: false, results: [] });
    await expect(client.getTransactionHeight(new H256())).resolves.toBe(99);
    await expect(client.getCandidates()).resolves.toEqual([]);
    await expect(client.getNextBlockValidators()).resolves.toEqual([]);
    await expect(client.invoke_contract_verify(new H160(), [])).resolves.toBeNull();
    await expect(client.invoke_script("AQID", [])).resolves.toBeNull();

    expect(requests.map((request) => request.method)).toEqual([
      "getapplicationlog",
      "getapplicationlog",
      "getcommittee",
      "getrawmempool",
      "getstateheight",
      "getproof",
      "verifyproof",
      "getstate",
      "getstorage",
      "findstates",
      "gettransactionheight",
      "getcandidates",
      "getnextblockvalidators",
      "invokecontractverify",
      "invokescript"
    ]);
  });
});
