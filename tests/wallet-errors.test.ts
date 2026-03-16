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
    expect(() => account.sign_witness(new Uint8Array([1]))).toThrow(/locked/);
    expect(() => account.get_script_hash()).toThrow();
  });

  it("covers wallet file and passphrase guard rails", async () => {
    const wallet = new Wallet({ name: "guard" });
    expect(() => wallet.create_account()).toThrow(/passphrase is not set/);

    const dir = await mkdtemp(join(tmpdir(), "neo-js-sdk-wallet-errors-"));
    cleanupPaths.push(dir);
    const path = join(dir, "wallet.json");
    await writeFile(path, "{}", "utf8");

    expect(() => wallet.write_to_file(path)).toThrow(/already exists/);
  });

  it("covers static wallet constructors and alias loaders", async () => {
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

    const fromJson = Wallet.from_json({
      name: "from-json",
      version: "1.0",
      scrypt: { n: 16384, r: 8, p: 8 },
      accounts: []
    });
    const opened = Wallet.open_nep6_wallet(path);

    expect(fromJson.name).toBe("from-json");
    expect(opened.name).toBe("static");
  });
});
