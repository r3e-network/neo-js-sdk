import { describe, expect, it } from "vitest";
import { PrivateKey, bytesToHex, decryptSecp256r1Key, encryptSecp256r1Key } from "../src/index.js";

describe("NEP-2", () => {
  it("decrypts and re-encrypts the Python SDK vector", async () => {
    const source = "6PYUUUFei9PBBfVkSn8q7hFCnewWFRBKPxcn6Kz6Bmk3FqWyLyuTQE2XFH";
    const key = await decryptSecp256r1Key(source, "city of zion");

    expect(key).toBeInstanceOf(PrivateKey);
    expect(bytesToHex(key.toBytes())).toBe("7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344");

    const encrypted = await encryptSecp256r1Key(key, "city of zion");
    expect(encrypted).toBe(source);
  });

  it("exposes synchronous python-style NEP-2 helpers", () => {
    const source = "6PYUUUFei9PBBfVkSn8q7hFCnewWFRBKPxcn6Kz6Bmk3FqWyLyuTQE2XFH";
    const key = decryptSecp256r1Key(source, "city of zion");

    expect(key).toBeInstanceOf(PrivateKey);
    expect(bytesToHex(key.toBytes())).toBe("7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344");
    expect(encryptSecp256r1Key(key, "city of zion")).toBe(source);
  });

  it("rejects invalid NEP-2 payload prefixes and checksum mismatches", () => {
    const original = "6PYUUUFei9PBBfVkSn8q7hFCnewWFRBKPxcn6Kz6Bmk3FqWyLyuTQE2XFH";
    const badPrefix = `7${original.slice(1)}`;

    expect(() => decryptSecp256r1Key(badPrefix, "city of zion")).toThrow();
    expect(() => decryptSecp256r1Key(original, "wrong passphrase")).toThrow(/checksum mismatch/);
  });
});
