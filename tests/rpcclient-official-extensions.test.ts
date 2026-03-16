import { describe, expect, it } from "vitest";
import { RpcClient, bytesToBase64, gasContractHash } from "../src/index.js";

describe("rpcclient official extensions", () => {
  it("exposes the remaining official Neo RPC methods", () => {
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => ({
        jsonrpc: "2.0",
        id: request.id,
        result: null
      })
    });

    const methods = [
      "getCandidates",
      "getStateRoot",
      "getProof",
      "verifyProof",
      "terminateSession",
      "getState",
      "findStates",
      "openWallet",
      "closeWallet",
      "dumpPrivKey",
      "getNewAddress",
      "getWalletBalance",
      "getWalletUnclaimedGas",
      "importPrivKey",
      "listAddress",
      "sendFrom",
      "sendMany",
      "sendToAddress",
      "cancelTransaction",
      "sendRawTransaction"
    ];

    for (const method of methods) {
      expect(typeof ((client as unknown) as Record<string, unknown>)[method]).toBe("function");
    }
  });

  it("serializes state-service RPC methods with Neo-compatible payload encoding", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: null
        };
      }
    });

    await client.getCandidates();
    await client.getStateRoot(123);
    await client.getApplicationLog(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      "Application"
    );
    await client.getProof(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      gasContractHash(),
      "010203"
    );
    await client.verifyProof(
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "deadbeef"
    );
    await client.getState(
      "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      gasContractHash(),
      "f00d"
    );
    await client.findStates(
      "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
      gasContractHash(),
      "0a0b",
      undefined,
      10
    );
    await client.findStates(
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
      gasContractHash(),
      new Uint8Array([0x01, 0x02]),
      new Uint8Array([0x03, 0x04]),
      5
    );
    await client.terminateSession("550e8400-e29b-41d4-a716-446655440000");

    expect(requests).toEqual([
      { method: "getcandidates", params: [] },
      { method: "getstateroot", params: [123] },
      {
        method: "getapplicationlog",
        params: [
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          "Application"
        ]
      },
      {
        method: "getproof",
        params: [
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "0xd2a4cff31913016155e38e474a2c06d08be276cf",
          "AQID"
        ]
      },
      {
        method: "verifyproof",
        params: [
          "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          bytesToBase64(Buffer.from("deadbeef", "hex"))
        ]
      },
      {
        method: "getstate",
        params: [
          "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
          "0xd2a4cff31913016155e38e474a2c06d08be276cf",
          bytesToBase64(Buffer.from("f00d", "hex"))
        ]
      },
      {
        method: "findstates",
        params: [
          "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          "0xd2a4cff31913016155e38e474a2c06d08be276cf",
          "Cgs=",
          "",
          10
        ]
      },
      {
        method: "findstates",
        params: [
          "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
          "0xd2a4cff31913016155e38e474a2c06d08be276cf",
          "AQI=",
          "AwQ=",
          5
        ]
      },
      {
        method: "terminatesession",
        params: ["550e8400-e29b-41d4-a716-446655440000"]
      }
    ]);
  });

  it("serializes wallet-node RPC methods with the official parameter order", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: null
        };
      }
    });

    const asset = gasContractHash();
    const from = "Ndz7d2xQ8d7d2xQ8d7d2xQ8d7d2xQ8d7d2";
    const to = "NbTiM6h8r99kpRtb428XcsUk1TzKed2gTc";
    const signers = [gasContractHash()];
    const transfers = [
      { asset, value: 1, address: to },
      { asset: asset.toString(), value: "2.5", address: from }
    ];

    await client.openWallet("/tmp/test.wallet.json", "secret");
    await client.closeWallet();
    await client.dumpPrivKey(from);
    await client.getNewAddress();
    await client.getWalletBalance(asset);
    await client.getWalletUnclaimedGas();
    await client.importPrivKey("L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g");
    await client.listAddress();
    await client.sendFrom(asset, from, to, 42, signers);
    await client.sendMany(transfers);
    await client.sendMany(transfers, from, signers);
    await client.sendToAddress(asset, to, "7.25");
    await client.cancelTransaction(
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      signers,
      "0.5"
    );
    await client.sendRawTransaction(new Uint8Array([1, 2, 3]));

    expect(requests).toEqual([
      { method: "openwallet", params: ["/tmp/test.wallet.json", "secret"] },
      { method: "closewallet", params: [] },
      { method: "dumpprivkey", params: [from] },
      { method: "getnewaddress", params: [] },
      { method: "getwalletbalance", params: ["0xd2a4cff31913016155e38e474a2c06d08be276cf"] },
      { method: "getwalletunclaimedgas", params: [] },
      { method: "importprivkey", params: ["L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g"] },
      { method: "listaddress", params: [] },
      {
        method: "sendfrom",
        params: [
          "0xd2a4cff31913016155e38e474a2c06d08be276cf",
          from,
          to,
          "42",
          ["0xd2a4cff31913016155e38e474a2c06d08be276cf"]
        ]
      },
      {
        method: "sendmany",
        params: [
          [
            {
              asset: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
              value: "1",
              address: to
            },
            {
              asset: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
              value: "2.5",
              address: from
            }
          ]
        ]
      },
      {
        method: "sendmany",
        params: [
          from,
          [
            {
              asset: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
              value: "1",
              address: to
            },
            {
              asset: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
              value: "2.5",
              address: from
            }
          ],
          ["0xd2a4cff31913016155e38e474a2c06d08be276cf"]
        ]
      },
      {
        method: "sendtoaddress",
        params: ["0xd2a4cff31913016155e38e474a2c06d08be276cf", to, "7.25"]
      },
      {
        method: "canceltransaction",
        params: [
          "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          ["0xd2a4cff31913016155e38e474a2c06d08be276cf"],
          "0.5"
        ]
      },
      { method: "sendrawtransaction", params: ["AQID"] }
    ]);
  });
});
