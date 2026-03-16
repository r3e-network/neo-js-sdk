import { describe, expect, it } from "vitest";
import { PrivateKey, PublicKey, deserialize, serialize } from "../src/index.js";

describe("keypair", () => {
  it("supports private keys from bytes and integers and verifies signatures", () => {
    const hex = "7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344";
    const bytesKey = new PrivateKey(Buffer.from(hex, "hex"));
    const intKey = new PrivateKey(BigInt(`0x${hex}`));
    const message = new Uint8Array([1, 2, 3]);
    const signature = bytesKey.sign(message);

    expect(Buffer.from(bytesKey.to_bytes()).toString("hex")).toBe(hex);
    expect(Buffer.from(intKey.to_bytes()).toString("hex")).toBe(hex);
    expect(bytesKey.public_key().verify(message, signature)).toBe(true);
    expect(bytesKey.public_key().verify(new Uint8Array([9]), signature)).toBe(false);
  });

  it("round-trips public keys through binary serialization", () => {
    const key = new PrivateKey(
      "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
    ).publicKey();

    const decoded = deserialize(serialize(key), PublicKey);
    expect(decoded.toString()).toBe(key.toString());
    expect(decoded.to_bytes()).toEqual(key.to_bytes());
  });
});
