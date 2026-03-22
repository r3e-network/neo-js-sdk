import { mkdtemp, readFile, rm } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { Account, Wallet } from "../src/index.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanupPaths.splice(0).map((path) =>
      rm(path, {
        force: true,
        recursive: true
      })
    )
  );
});

describe("NEP-6 wallet", () => {
  it("creates, writes, opens, and decrypts an account", async () => {
    const wallet = new Wallet({ name: "test", passphrase: "test" });
    const account = wallet.createAccount();

    expect(wallet.accounts).toHaveLength(1);
    expect(account.signable()).toBe(true);

    const dir = await mkdtemp(join(tmpdir(), "neo-js-sdk-"));
    cleanupPaths.push(dir);
    const path = join(dir, "test-wallet.json");

    wallet.writeToFile(path);

    const file = JSON.parse(await readFile(path, "utf8")) as {
      name: string;
      accounts: unknown[];
    };

    expect(file.name).toBe("test");
    expect(file.accounts).toHaveLength(1);

    const reopened = Wallet.openNep6Wallet(path);
    expect(reopened.accounts).toHaveLength(1);

    reopened.decrypt("test");
    expect(reopened.accounts[0].signable()).toBe(true);
    expect(reopened.accounts[0].getScriptHash().equals(account.getScriptHash())).toBe(true);
  });

  it("keeps wallet operations on the canonical js method names", async () => {
    const wallet = new Wallet({ name: "sync", passphrase: "secret" });
    const account = wallet.createAccount();

    expect(account).toBeInstanceOf(Account);
    expect(wallet.accounts).toHaveLength(1);

    const dir = await mkdtemp(join(tmpdir(), "neo-js-sdk-sync-"));
    cleanupPaths.push(dir);
    const path = join(dir, "wallet.json");

    wallet.writeToFile(path);
    const reopened = Wallet.openNep6Wallet(path);
    reopened.decrypt("secret");

    expect(reopened.accounts[0].signable()).toBe(true);
    expect("create_account" in wallet).toBe(false);
    expect("write_to_file" in wallet).toBe(false);
    expect("open_nep6_wallet" in Wallet).toBe(false);
  });

  it("keeps NEP-6 JSON serialization/deserialization strict", async () => {
    const watchOnly = new Account({
      address: "NbTiM6h8r99kpRtb428XcsUk1TzKed2gTc",
      key: "6PYUUUFei9PBBfVkSn8q7hFCnewWFRBKPxcn6Kz6Bmk3FqWyLyuTQE2XFH",
      contract: null
    });

    expect(() => watchOnly.toJSON()).toThrow();

    const dir = await mkdtemp(join(tmpdir(), "neo-js-sdk-null-contract-"));
    cleanupPaths.push(dir);
    const path = join(dir, "wallet.json");
    writeFileSync(
      path,
      JSON.stringify({
        name: "watch-only",
        version: "1.0",
        scrypt: { n: 16384, r: 8, p: 8 },
        accounts: [
          {
            address: "NbTiM6h8r99kpRtb428XcsUk1TzKed2gTc",
            key: "6PYUUUFei9PBBfVkSn8q7hFCnewWFRBKPxcn6Kz6Bmk3FqWyLyuTQE2XFH",
            label: "",
            isDefault: true,
            lock: false,
            contract: null
          }
        ]
      }),
      "utf8"
    );

    expect(() => Wallet.openNep6Wallet(path)).toThrow();
    expect("to_json" in watchOnly).toBe(false);
  });
});
