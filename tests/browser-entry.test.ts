import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import * as browserSdk from "../src/browser.js";

describe("browser entry", () => {
  it("declares a browser-safe package entry for bundlers", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
      exports?: {
        ".": {
          browser?: string;
        };
      };
    };

    expect(packageJson.exports?.["."].browser).toBe("./dist/browser.js");
  });

  it("exposes neon-js compatibility namespaces for browser consumers", () => {
    expect(browserSdk.wallet?.Account).toBeTypeOf("function");
    expect(browserSdk.wallet?.getAddressFromScriptHash).toBeTypeOf("function");
    expect(browserSdk.rpc?.RPCClient).toBeTypeOf("function");
    expect(browserSdk.sc?.ScriptBuilder).toBeTypeOf("function");
    expect(browserSdk.sc?.ContractParam).toBeTypeOf("function");
    expect(browserSdk.tx?.Transaction).toBeTypeOf("function");
    expect(browserSdk.tx?.WitnessScope?.Global).toBeTypeOf("number");
    expect(browserSdk.u?.HexString?.fromHex).toBeTypeOf("function");
    expect(browserSdk.u?.reverseHex).toBeTypeOf("function");
  });

  it("provides a browser Account and Transaction surface compatible with the explorer", () => {
    const account = new browserSdk.Account();

    expect(account.privateKey).toMatch(/^[0-9a-f]{64}$/i);
    expect(String(account.publicKey)).toMatch(/^(02|03)[0-9a-f]{64}$/i);
    expect(account.address).toMatch(/^N/);
    expect(account.scriptHash).toMatch(/^[0-9a-f]{40}$/i);
    expect(account.sign("010203")).toMatch(/^[0-9a-f]{128}$/i);

    const fromWif = browserSdk.Account.fromWIF(account.WIF);
    expect(fromWif.address).toBe(account.address);
    expect(String(fromWif.publicKey)).toBe(String(account.publicKey));

    const tx = new browserSdk.tx.Transaction({
      nonce: 1,
      systemFee: 0,
      networkFee: 0,
      validUntilBlock: 1,
      script: browserSdk.u.HexString.fromHex("40"),
      signers: [{ account: account.scriptHash, scopes: browserSdk.tx.WitnessScope.CalledByEntry }],
    });

    tx.sign(account.privateKey, browserSdk.testNetworkId());

    expect(tx.witnesses).toHaveLength(1);
    expect(tx.serialize(true)).toMatch(/^[0-9a-f]+$/i);
    expect(tx.hash()).toMatch(/^[0-9a-f]{64}$/i);
  });
});
