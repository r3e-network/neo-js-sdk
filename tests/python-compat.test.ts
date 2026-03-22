import { describe, expect, it } from "vitest";
import {
  BinaryReader,
  BinaryWriter,
  Block,
  H160,
  H256,
  Header,
  InvokeParameters,
  PrivateKey,
  RpcClient,
  ScriptBuilder,
  Signer,
  TrimmedBlock,
  Tx,
  Wallet,
  Witness,
  WitnessRule,
  WitnessRuleAction,
  WitnessScope,
  addressVersion,
  gasContractHash,
  mainNetworkId,
  mainnetEndpoints,
  testNetworkId,
  testnetEndpoints,
} from "../src/index.js";
import * as sdk from "../src/index.js";

/**
 * Centralized snake_case rejection tests.
 *
 * Every public class/namespace must expose ONLY camelCase.
 * This single file replaces scattered alias checks across the suite.
 */
describe("camelCase sdk surface", () => {
  it("exports canonical top-level helpers and namespaces", () => {
    expect(mainNetworkId()).toBe(860833102);
    expect(testNetworkId()).toBe(894710606);
    expect(addressVersion()).toBe(53);
    expect(gasContractHash().toString()).toBe("0xd2a4cff31913016155e38e474a2c06d08be276cf");
    expect(mainnetEndpoints()).toHaveLength(5);
    expect(testnetEndpoints()).toHaveLength(5);
  });

  it("rejects snake_case on top-level sdk exports", () => {
    const banned = [
      "main_network_id",
      "test_network_id",
      "address_version",
      "gas_contract_hash",
      "mainnet_endpoints",
      "testnet_endpoints",
      "encrypt_secp256r1_key",
      "decrypt_secp256r1_key",
      "rpcclient",
      "wallet",
    ];
    for (const name of banned) {
      expect(name in sdk).toBe(false);
    }
  });

  it("rejects snake_case on PrivateKey / PublicKey", () => {
    const key = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6");
    const pub = key.publicKey();

    for (const name of ["to_bytes", "public_key", "sign_witness"]) {
      expect(name in key).toBe(false);
    }
    for (const name of ["get_script_hash", "get_address", "to_bytes"]) {
      expect(name in pub).toBe(false);
    }
  });

  it("rejects snake_case on ScriptBuilder", () => {
    const builder = new ScriptBuilder();
    for (const name of ["emit_push", "to_bytes", "emit_syscall", "emit_contract_call"]) {
      expect(name in builder).toBe(false);
    }
  });

  it("rejects snake_case on BinaryReader / BinaryWriter", () => {
    const writer = new BinaryWriter();
    const reader = new BinaryReader(new Uint8Array([0]));
    expect("write_uint8" in writer).toBe(false);
    expect("read_uint8" in reader).toBe(false);
  });

  it("rejects snake_case on Witness / WitnessRule", () => {
    const witness = new Witness(new Uint8Array([1]), new Uint8Array([2]));
    const rule = new WitnessRule(WitnessRuleAction.Allow, []);
    expect("to_json" in witness).toBe(false);
    expect("to_json" in rule).toBe(false);
  });

  it("rejects snake_case on Block / Header / TrimmedBlock", () => {
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
      witness,
    });
    const block = new Block(header, []);
    const trimmed = new TrimmedBlock(header, [new H256()]);

    for (const obj of [header, block, trimmed]) {
      for (const name of ["to_bytes", "to_json", "get_sign_data", "marshal_unsigned_to"]) {
        expect(name in obj).toBe(false);
      }
    }
  });

  it("rejects snake_case on Wallet / Account", () => {
    const wallet = new Wallet({ name: "test", passphrase: "test" });
    const account = wallet.createAccount();
    const params = new InvokeParameters().addString("neo");

    for (const name of ["create_account", "write_to_file"]) {
      expect(name in wallet).toBe(false);
    }
    for (const name of ["watch_only", "get_script_hash", "sign_witness"]) {
      expect(name in account).toBe(false);
    }
    for (const name of ["add_string", "to_json"]) {
      expect(name in params).toBe(false);
    }
    expect("from_json" in Wallet).toBe(false);
    expect("open_nep6_wallet" in Wallet).toBe(false);
    expect("to_json" in account).toBe(false);
  });

  it("rejects snake_case on RpcClient", () => {
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => ({ jsonrpc: "2.0" as const, id: request.id, result: null }),
    });

    const banned = [
      "get_unclaimed_gas",
      "list_plugins",
      "send_raw_transaction",
      "send_tx",
      "validate_address",
      "get_version",
      "get_committee",
      "get_connection_count",
      "get_contract_state",
      "get_native_contracts",
      "get_peers",
      "traverse_iterator",
      "get_application_log",
      "invoke_contract_verify",
      "invoke_script",
      "cancel_tx",
      "open_wallet",
      "close_wallet",
      "dump_priv_key",
      "get_new_address",
      "get_wallet_balance",
      "get_wallet_unclaimed_gas",
      "import_priv_key",
      "list_address",
      "submit_block",
      "get_block_header",
    ];
    for (const name of banned) {
      expect(name in client).toBe(false);
    }
  });

  it("keeps core classes on a single camelCase API surface", () => {
    const privateKey = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6");
    const publicKey = privateKey.publicKey();
    const script = new ScriptBuilder().emitContractCall(gasContractHash(), "symbol").toBytes();
    const tx = new Tx({
      nonce: 1,
      systemFee: 2n,
      networkFee: 3n,
      validUntilBlock: 4,
      script,
      signers: [new Signer({ account: publicKey.getScriptHash(), scopes: WitnessScope.CalledByEntry })],
    });
    const witness = privateKey.signWitness(tx.getSignData(testNetworkId()));
    tx.witnesses = [witness];

    expect(script.length).toBeGreaterThan(0);
    expect(publicKey.getAddress(addressVersion())).toMatch(/^N/);
    expect(tx.toJSON().signers).toHaveLength(1);
    expect(witness.toJSON().invocation.length).toBeGreaterThan(0);
  });

  it("accepts camelCase object options on getBlockHeader", async () => {
    const requests: Array<{ method: string; params: unknown[] }> = [];
    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => {
        requests.push({ method: request.method, params: request.params });
        return { jsonrpc: "2.0" as const, id: request.id, result: request.method };
      },
    });

    await expect(client.getBlockHeader({ blockHash: "0xabc", verbose: false })).resolves.toBe("getblockheader");
    await expect(client.getBlockHeader({ height: 12, verbose: true })).resolves.toBe("getblockheader");

    expect(requests).toEqual([
      { method: "getblockheader", params: ["0xabc", false] },
      { method: "getblockheader", params: [12, true] },
    ]);

    await expect(client.getBlockHeader({})).rejects.toMatchObject({ code: -32602 });
    await expect(client.getBlockHeader({ blockHash: "0xabc", height: 12 })).rejects.toMatchObject({ code: -32602 });
  });
});
