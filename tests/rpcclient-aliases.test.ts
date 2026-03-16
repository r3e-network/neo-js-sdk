import { describe, expect, it } from "vitest";
import { H160, RpcClient, WitnessScope } from "../src/index.js";

describe("rpcclient aliases", () => {
  it("covers snake_case rpc aliases and convenience wrappers", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        switch (request.method) {
          case "getunclaimedgas":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { unclaimed: "123", address: "N" }
            };
          case "listplugins":
            return { jsonrpc: "2.0", id: request.id, result: [] };
          case "sendrawtransaction":
            return { jsonrpc: "2.0", id: request.id, result: { hash: "0xtx" } };
          case "submitblock":
            return { jsonrpc: "2.0", id: request.id, result: { hash: "0xblock" } };
          case "validateaddress":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { address: "N", isvalid: true }
            };
          case "getversion":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: {
                tcpport: 10333,
                wsport: 10334,
                nonce: 1,
                useragent: "neo",
                protocol: {
                  addressversion: 53,
                  network: 860833102,
                  validatorscount: 7,
                  msperblock: 15000,
                  maxtraceableblocks: 2102400,
                  maxvaliduntilblockincrement: 5760,
                  maxtransactionsperblock: 512,
                  memorypoolmaxtransactions: 50000,
                  initialgasdistribution: 5200000000000000
                }
              }
            };
          default:
            return { jsonrpc: "2.0", id: request.id, result: null };
        }
      }
    });

    await expect(client.get_unclaimed_gas("N")).resolves.toEqual({ unclaimed: "123", address: "N" });
    await expect(client.list_plugins()).resolves.toEqual([]);
    await expect(client.send_raw_transaction("AQID")).resolves.toEqual({ hash: "0xtx" });
    await expect(client.send_tx("AQID")).resolves.toEqual({ hash: "0xtx" });
    await expect(client.submit_block("AQID")).resolves.toEqual({ hash: "0xblock" });
    await expect(client.validate_address("N")).resolves.toEqual({ address: "N", isvalid: true });
    await expect(client.get_version()).resolves.toMatchObject({ useragent: "neo" });
    await expect(client.get_committee()).resolves.toBeNull();
    await expect(client.get_connection_count()).resolves.toBeNull();
    await expect(client.get_contract_state("0xabc")).resolves.toBeNull();
    await expect(client.get_native_contracts()).resolves.toBeNull();
    await expect(client.get_peers()).resolves.toBeNull();

    expect(requests.map((request) => request.method)).toEqual([
      "getunclaimedgas",
      "listplugins",
      "sendrawtransaction",
      "sendrawtransaction",
      "submitblock",
      "validateaddress",
      "getversion",
      "getcommittee",
      "getconnectioncount",
      "getcontractstate",
      "getnativecontracts",
      "getpeers"
    ]);
  });

  it("covers wallet-node helpers with signer/hash conversions", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        return { jsonrpc: "2.0", id: request.id, result: { hash: "0xrelay" } };
      }
    });

    const hash = new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf");

    await client.sendFrom(hash, "from", "to", "1", [hash]);
    await client.sendMany([{ asset: hash, value: 1n, address: "to" }], "from", [hash]);
    await client.sendToAddress(hash, "to", 2);
    await client.cancel_tx("0xabc", [hash], 3n);
    await client.cancelTransaction("0xdef", [hash], 4);
    await client.openWallet("/tmp/wallet.json", "pw");
    await client.closeWallet();
    await client.dumpPrivKey("N");
    await client.getNewAddress();
    await client.getWalletBalance(hash);
    await client.getWalletUnclaimedGas();
    await client.importPrivKey("L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g");
    await client.listAddress();

    expect(requests).toEqual([
      { method: "sendfrom", params: ["0xd2a4cff31913016155e38e474a2c06d08be276cf", "from", "to", "1", ["0xd2a4cff31913016155e38e474a2c06d08be276cf"]] },
      { method: "sendmany", params: ["from", [{ asset: "0xd2a4cff31913016155e38e474a2c06d08be276cf", value: "1", address: "to" }], ["0xd2a4cff31913016155e38e474a2c06d08be276cf"]] },
      { method: "sendtoaddress", params: ["0xd2a4cff31913016155e38e474a2c06d08be276cf", "to", "2"] },
      { method: "canceltx", params: ["0xabc", ["0xd2a4cff31913016155e38e474a2c06d08be276cf"], "3"] },
      { method: "canceltransaction", params: ["0xdef", ["0xd2a4cff31913016155e38e474a2c06d08be276cf"], "4"] },
      { method: "openwallet", params: ["/tmp/wallet.json", "pw"] },
      { method: "closewallet", params: [] },
      { method: "dumpprivkey", params: ["N"] },
      { method: "getnewaddress", params: [] },
      { method: "getwalletbalance", params: ["0xd2a4cff31913016155e38e474a2c06d08be276cf"] },
      { method: "getwalletunclaimedgas", params: [] },
      { method: "importprivkey", params: ["L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g"] },
      { method: "listaddress", params: [] }
    ]);
  });

  it("covers snake_case wallet-node aliases", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        return { jsonrpc: "2.0", id: request.id, result: { hash: "0xrelay" } };
      }
    });

    const hash = new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf");

    await client.send_from(hash, "from", "to", 1);
    await client.send_many([{ asset: hash, value: "2", address: "to" }]);
    await client.send_to_address(hash, "to", 3);
    await client.open_wallet("/tmp/wallet.json", "pw");
    await client.close_wallet();
    await client.dump_priv_key("N");
    await client.get_new_address();
    await client.get_wallet_balance(hash);
    await client.get_wallet_unclaimed_gas();
    await client.import_priv_key("L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g");
    await client.list_address();

    expect(requests.map((request) => request.method)).toEqual([
      "sendfrom",
      "sendmany",
      "sendtoaddress",
      "openwallet",
      "closewallet",
      "dumpprivkey",
      "getnewaddress",
      "getwalletbalance",
      "getwalletunclaimedgas",
      "importprivkey",
      "listaddress"
    ]);
  });
});
