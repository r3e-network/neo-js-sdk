import { describe, expect, it } from "vitest";
import {
  Account,
  InvokeParameters,
  PrivateKey,
  RpcClient,
  ScriptBuilder,
  Signer,
  Tx,
  Wallet,
  WitnessScope,
  address_version,
  gas_contract_hash,
  main_network_id,
  mainnet_endpoints,
  rpcclient,
  test_network_id,
  testnet_endpoints,
  wallet
} from "../src/index.js";

describe("python compatibility", () => {
  it("exports Python-style snake_case top-level helpers and namespaces", () => {
    expect(main_network_id()).toBe(860833102);
    expect(test_network_id()).toBe(894710606);
    expect(address_version()).toBe(53);
    expect(gas_contract_hash().toString()).toBe("0xd2a4cff31913016155e38e474a2c06d08be276cf");
    expect(mainnet_endpoints()).toEqual(rpcclient.mainnet_endpoints());
    expect(testnet_endpoints()).toEqual(rpcclient.testnet_endpoints());
    expect(wallet.Wallet).toBe(Wallet);
    expect(rpcclient.RpcClient).toBe(RpcClient);
  });

  it("provides Python-style method aliases on core classes", () => {
    const privateKey = new PrivateKey(
      "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
    );
    const publicKey = privateKey.public_key();
    const script = new ScriptBuilder()
      .emit_contract_call(gas_contract_hash(), "symbol")
      .to_bytes();
    const tx = new Tx({
      nonce: 1,
      systemFee: 2n,
      networkFee: 3n,
      validUntilBlock: 4,
      script,
      signers: [
        new Signer({
          account: publicKey.get_script_hash(),
          scopes: WitnessScope.CalledByEntry
        })
      ]
    });
    const witness = privateKey.sign_witness(tx.get_sign_data(test_network_id()));
    tx.witnesses = [witness];

    expect(publicKey.get_script_hash().toString()).toBe(publicKey.getScriptHash().toString());
    expect(publicKey.get_address(address_version())).toBe(publicKey.getAddress(address_version()));
    expect(publicKey.get_signature_redeem_script()).toEqual(publicKey.getSignatureRedeemScript());
    expect(script).toEqual(new ScriptBuilder().emitContractCall(gas_contract_hash(), "symbol").toBytes());
    expect(tx.to_bytes()).toEqual(tx.toBytes());
    expect(tx.to_json().signers).toHaveLength(1);
    expect(witness.to_json().invocation).toBe(witness.toJSON().invocation);
  });

  it("provides Python-style method aliases on wallet and rpc helpers", async () => {
    const params = new InvokeParameters().add_string("neo").add_integer(1);
    expect(params.to_json()).toEqual([
      { type: "String", value: "neo" },
      { type: "Integer", value: "1" }
    ]);

    const walletInstance = new Wallet({ name: "compat", passphrase: "secret" });
    const account = await walletInstance.create_account();

    expect(account).toBeInstanceOf(Account);
    expect(account.watch_only()).toBe(false);
    expect(account.get_script_hash().toString()).toBe(account.getScriptHash().toString());

    const client = new RpcClient("http://localhost:10332", {
      transport: async (_url, request) => ({
        jsonrpc: "2.0",
        id: request.id,
        result: request.method
      })
    });

    await expect(client.get_block_count()).resolves.toBe("getblockcount");
    await expect(client.get_best_block_hash()).resolves.toBe("getbestblockhash");
    await expect(client.get_version()).resolves.toBe("getversion");
  });
});
