import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { Wallet } from "../src/index.js";

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
    const account = await wallet.createAccount();

    expect(wallet.accounts).toHaveLength(1);
    expect(account.signable()).toBe(true);

    const dir = await mkdtemp(join(tmpdir(), "neo-js-sdk-"));
    cleanupPaths.push(dir);
    const path = join(dir, "test-wallet.json");

    await wallet.writeToFile(path);

    const file = JSON.parse(await readFile(path, "utf8")) as {
      name: string;
      accounts: unknown[];
    };

    expect(file.name).toBe("test");
    expect(file.accounts).toHaveLength(1);

    const reopened = await Wallet.openNep6Wallet(path);
    expect(reopened.accounts).toHaveLength(1);

    await reopened.decrypt("test");
    expect(reopened.accounts[0].signable()).toBe(true);
    expect(reopened.accounts[0].getScriptHash().equals(account.getScriptHash())).toBe(true);
  });
});
