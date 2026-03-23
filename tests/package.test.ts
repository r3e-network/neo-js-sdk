import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import * as sdk from "../src/index.js";

describe("package exports", () => {
  it("exports Neo N3 network constants", () => {
    expect(sdk.mainNetworkId()).toBe(860833102);
    expect(sdk.testNetworkId()).toBe(894710606);
    expect(sdk.addressVersion()).toBe(53);
  });

  it("uses the restored package name and canonical import path in metadata and docs", async () => {
    const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
      name: string;
      sideEffects?: boolean;
      publishConfig?: { access?: string };
      engines?: { node?: string };
      dependencies?: Record<string, string>;
    };
    const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

    expect(packageJson.name).toBe("@r3e/neo-js-sdk");
    expect(packageJson.sideEffects).toBe(false);
    expect(packageJson.publishConfig).toEqual({ access: "public" });
    expect(packageJson.engines).toEqual({ node: ">=18" });
    expect(packageJson.dependencies).not.toHaveProperty("@cityofzion/neon-core");
    expect(readme).toContain("# neo-js-sdk");
    expect(readme).toContain("npm install @r3e/neo-js-sdk");
    expect(readme).toContain('from "@r3e/neo-js-sdk"');
    expect(readme).toContain('from "@r3e/neo-js-sdk/browser"');
    expect(readme).toContain('from "@r3e/neo-js-sdk/core"');
    expect(readme).not.toContain('from "neo-js-sdk"');
  });

  it("contains no source imports from neon-core", async () => {
    const sourceFiles = [
      "../src/browser.ts",
      "../src/core/keypair.ts",
      "../src/core/opcode.ts",
      "../src/wallet/nep6.ts",
      "../src/wallet/nep6-browser.ts",
    ];

    const sources = await Promise.all(
      sourceFiles.map((file) => readFile(new URL(file, import.meta.url), "utf8")),
    );

    for (const source of sources) {
      expect(source).not.toContain("@cityofzion/neon-core");
    }
  });

  it("publishes only the canonical camelCase top-level helpers", () => {
    expect("main_network_id" in sdk).toBe(false);
    expect("test_network_id" in sdk).toBe(false);
    expect("address_version" in sdk).toBe(false);
    expect("gas_contract_hash" in sdk).toBe(false);
    expect("mainnet_endpoints" in sdk).toBe(false);
    expect("testnet_endpoints" in sdk).toBe(false);
    expect("encrypt_secp256r1_key" in sdk).toBe(false);
    expect("decrypt_secp256r1_key" in sdk).toBe(false);
    expect("rpcclient" in sdk).toBe(false);
    expect("wallet" in sdk).toBe(false);
  });
});
