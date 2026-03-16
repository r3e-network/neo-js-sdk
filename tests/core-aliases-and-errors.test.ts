import { describe, expect, it } from "vitest";
import {
  BinaryReader,
  Block,
  CalledByEntryCondition,
  H160,
  H256,
  Header,
  JsonRpcError,
  RpcClient,
  RpcCode,
  ScriptBuilder,
  TrimmedBlock,
  TxAttribute,
  Witness,
  WitnessRule
} from "../src/index.js";

describe("core aliases and error paths", () => {
  it("covers block alias helpers on full and trimmed blocks", () => {
    const witness = new Witness(new Uint8Array([1]), new Uint8Array([2]));
    const header = new Header({
      version: 0,
      previousBlockHash: new H256(),
      merkleRoot: new H256(),
      unixMillis: 1,
      nonce: 2,
      index: 3,
      primaryIndex: 0,
      nextConsensus: new H160(),
      witness
    });
    const block = new Block(header, []);
    const trimmed = new TrimmedBlock(header, [new H256()]);

    expect(block.to_bytes()).toEqual(block.toBytes());
    expect(block.to_json()).toEqual(block.toJSON());
    expect(trimmed.to_bytes()).toEqual(trimmed.toBytes());
    expect(trimmed.to_json()).toEqual(trimmed.toJSON());
  });

  it("covers script aliases and explicit syscall emission", () => {
    const builder = new ScriptBuilder();
    const script = builder.emit_syscall(0x11223344, [1, "neo"]).to_bytes();

    expect(script.length).toBeGreaterThan(0);
    expect(builder.toHex()).toMatch(/^[0-9a-f]+$/);
  });

  it("throws on invalid witness rule and tx attribute discriminants", () => {
    const invalidRuleReader = new BinaryReader(new Uint8Array([0xff, 0x00]));
    expect(() => WitnessRule.unmarshalFrom(invalidRuleReader)).toThrow(/unexpected WitnessRuleAction/);

    const invalidAttrReader = new BinaryReader(new Uint8Array([0xff]));
    expect(() => TxAttribute.unmarshalFrom(invalidAttrReader)).toThrow(/unexpected TxAttributeType/);
  });

  it("covers snake_case rpc aliases for utility wrappers", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        switch (request.method) {
          case "listplugins":
            return { jsonrpc: "2.0", id: request.id, result: [] };
          case "validateaddress":
            return {
              jsonrpc: "2.0",
              id: request.id,
              result: { address: "N", isvalid: true }
            };
          case "submitblock":
            return { jsonrpc: "2.0", id: request.id, result: { hash: "0xblock" } };
          case "sendrawtransaction":
            return { jsonrpc: "2.0", id: request.id, result: { hash: "0xtx" } };
          case "canceltx":
            return { jsonrpc: "2.0", id: request.id, result: { hash: "0xcancel" } };
          default:
            return { jsonrpc: "2.0", id: request.id, result: null };
        }
      }
    });

    await expect(client.list_plugins()).resolves.toEqual([]);
    await expect(client.validate_address("N")).resolves.toEqual({ address: "N", isvalid: true });
    await expect(client.submit_block("AQID")).resolves.toEqual({ hash: "0xblock" });
    await expect(client.send_tx("AQID")).resolves.toEqual({ hash: "0xtx" });
    await expect(client.cancel_tx("0xabc", [], 1n)).resolves.toEqual({ hash: "0xcancel" });

    expect(requests).toEqual([
      { method: "listplugins", params: [] },
      { method: "validateaddress", params: ["N"] },
      { method: "submitblock", params: ["AQID"] },
      { method: "sendrawtransaction", params: ["AQID"] },
      { method: "canceltx", params: ["0xabc", [], "1"] }
    ]);
  });

  it("keeps JsonRpcError string formatting stable", () => {
    expect(new JsonRpcError(RpcCode.BadRequest, "bad").toString()).toBe(
      "JsonRpcError{code:-32700,message:bad}"
    );
  });
});
