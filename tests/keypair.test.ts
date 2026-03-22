import { describe, expect, it } from "vitest";
import {
  BinaryReader,
  BinaryWriter,
  H160,
  PrivateKey,
  PublicKey,
  Tx,
  TxAttribute,
  TxAttributeType,
  deserialize,
  serialize,
} from "../src/index.js";

describe("keypair", () => {
  it("supports private keys from bytes and integers and verifies signatures", () => {
    const hex = "7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344";
    const bytesKey = new PrivateKey(Buffer.from(hex, "hex"));
    const intKey = new PrivateKey(BigInt(`0x${hex}`));
    const message = new Uint8Array([1, 2, 3]);
    const signature = bytesKey.sign(message);

    expect(Buffer.from(bytesKey.toBytes()).toString("hex")).toBe(hex);
    expect(Buffer.from(intKey.toBytes()).toString("hex")).toBe(hex);
    expect(bytesKey.publicKey().verify(message, signature)).toBe(true);
    expect(bytesKey.publicKey().verify(new Uint8Array([9]), signature)).toBe(false);
  });

  it("round-trips public keys through binary serialization", () => {
    const key = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6").publicKey();

    const decoded = deserialize(serialize(key), PublicKey);
    expect(decoded.toString()).toBe(key.toString());
    expect(decoded.toBytes()).toEqual(key.toBytes());
  });

  it("rejects invalid public key encodings and covers equality with string inputs", () => {
    const key = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6").publicKey();

    expect(key.equals(key.toString())).toBe(true);
    expect(() =>
      PublicKey.unmarshalFrom(
        new (class {
          public readUInt8(): number {
            return 0x01;
          }
          public read(): Uint8Array {
            return new Uint8Array();
          }
        })() as never,
      ),
    ).toThrow(/unexpected PublicKey prefix/);
    expect(() => new PublicKey("abcd")).toThrow();
    expect(() => new H160("0x01")).toThrow();
  });

  it("rejects PrivateKey with invalid hex string length", () => {
    expect(() => new PrivateKey("aabbcc")).toThrow("invalid secp256r1 private key");
  });

  it("rejects PrivateKey with wrong Uint8Array length", () => {
    expect(() => new PrivateKey(new Uint8Array(31))).toThrow("invalid secp256r1 private key");
    expect(() => new PrivateKey(new Uint8Array(33))).toThrow("invalid secp256r1 private key");
  });

  it("returns compressed public key with valid prefix byte", () => {
    const key = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6").publicKey();

    const compressed = key.toBytes();
    expect(compressed[0] === 0x02 || compressed[0] === 0x03).toBe(true);
    expect(compressed.length).toBe(33);
  });
});

describe("tx version validation", () => {
  it("rejects Tx with unexpected version", () => {
    const writer = new BinaryWriter();
    writer.writeUInt8(1);
    writer.writeUInt32LE(0);
    const reader = new BinaryReader(writer.toBytes());
    expect(() => Tx.unmarshalFrom(reader)).toThrow("unexpected tx version: 1");
  });

  it("TxAttribute base toJSON covers the type enum mapping", () => {
    const attr = new TxAttribute(TxAttributeType.HighPriority);
    const json = attr.toJSON();
    expect(json.type).toBe("HighPriority");
  });
});
