import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { Account, Wallet } from "../src/index.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map(async (path) => {
      const { rm } = await import("node:fs/promises");
      await rm(path, { force: true, recursive: true });
    })
  );
});

describe("wallet error handling", () => {
  it("covers account lock and invalid address errors", () => {
    const account = new Account({
      address: "bad-address",
      key: "6PYUUUFei9PBBfVkSn8q7hFCnewWFRBKPxcn6Kz6Bmk3FqWyLyuTQE2XFH",
      contract: null
    });

    expect(() => account.sign(new Uint8Array([1]))).toThrow(/locked/);
    expect(() => account.signWitness(new Uint8Array([1]))).toThrow(/locked/);
    expect(() => account.getScriptHash()).toThrow();
    expect("sign_witness" in account).toBe(false);
    expect("get_script_hash" in account).toBe(false);
  });

  it("covers wallet file and passphrase guard rails", async () => {
    const wallet = new Wallet({ name: "guard" });
    expect(() => wallet.createAccount()).toThrow(/passphrase is not set/);

    const dir = await mkdtemp(join(tmpdir(), "neo-js-sdk-wallet-errors-"));
    cleanupPaths.push(dir);
    const path = join(dir, "wallet.json");
    await writeFile(path, "{}", "utf8");

    expect(() => wallet.writeToFile(path)).toThrow(/already exists/);
    expect("create_account" in wallet).toBe(false);
    expect("write_to_file" in wallet).toBe(false);
  });

  it("covers static wallet constructors on the canonical names", async () => {
    const dir = await mkdtemp(join(tmpdir(), "neo-js-sdk-wallet-static-"));
    cleanupPaths.push(dir);
    const path = join(dir, "wallet.json");
    await writeFile(
      path,
      JSON.stringify({
        name: "static",
        version: "1.0",
        scrypt: { n: 16384, r: 8, p: 8 },
        accounts: []
      }),
      "utf8"
    );

    const fromJson = Wallet.fromJSON({
      name: "from-json",
      version: "1.0",
      scrypt: { n: 16384, r: 8, p: 8 },
      accounts: []
    });
    const opened = Wallet.openNep6Wallet(path);

    expect(fromJson.name).toBe("from-json");
    expect(opened.name).toBe("static");
    expect("from_json" in Wallet).toBe(false);
    expect("open_nep6_wallet" in Wallet).toBe(false);
  });
});
