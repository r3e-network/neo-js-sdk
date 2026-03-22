import { describe, expect, it } from "vitest";
import {
  BinaryReader,
  BinaryWriter,
  H160,
  OpCode,
  PrivateKey,
  ScriptBuilder,
  Signer,
  Tx,
  WitnessScope,
  deserialize,
  serialize,
  testNetworkId,
  witnessScopeName,
} from "../src/index.js";
import { normalizeHex } from "../src/internal/hex.js";

describe("core serialization", () => {
  it("formats hash wrappers as Neo big-endian hex strings", () => {
    const hash160 = new H160("0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5");

    expect(hash160.toString()).toBe("0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5");
    expect(hash160.toBytes()).toHaveLength(20);
  });

  it("formats witness scope flag names like the Python SDK", () => {
    const scopes = WitnessScope.CalledByEntry | WitnessScope.WitnessRules;
    expect(witnessScopeName(scopes)).toBe("CalledByEntry,WitnessRules");
  });

  it("serializes and deserializes a signed transaction", () => {
    const privateKey = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6");
    const script = new ScriptBuilder().emit(OpCode.RET).toBytes();
    const tx = new Tx({
      nonce: 1,
      systemFee: 12n,
      networkFee: 23n,
      validUntilBlock: 56,
      script,
      signers: [
        new Signer({
          account: privateKey.publicKey().getScriptHash(),
          scopes: WitnessScope.CalledByEntry,
        }),
      ],
    });

    const witness = privateKey.signWitness(tx.getSignData(testNetworkId()));
    tx.witnesses = [witness];

    const data = serialize(tx);
    const decoded = deserialize(data, Tx);

    expect(decoded.nonce).toBe(1);
    expect(decoded.systemFee).toBe(12n);
    expect(decoded.networkFee).toBe(23n);
    expect(decoded.validUntilBlock).toBe(56);
    expect(Array.from(decoded.script)).toEqual(Array.from(script));
    expect(decoded.signers).toHaveLength(1);
    expect(decoded.signers[0].account.equals(privateKey.publicKey().getScriptHash())).toBe(true);
    expect(decoded.signers[0].scopes).toBe(WitnessScope.CalledByEntry);
    expect(decoded.witnesses).toHaveLength(1);
    expect(decoded.witnesses[0].equals(witness)).toBe(true);
    expect(decoded.attributes).toEqual([]);
  });
});

describe("hex validation", () => {
  it("throws on odd-length hex string", () => {
    expect(() => normalizeHex("0x123")).toThrow("even length");
    expect(() => normalizeHex("abc")).toThrow("even length");
  });

  it("accepts even-length hex strings", () => {
    expect(normalizeHex("0x1234")).toBe("1234");
    expect(normalizeHex("abcd")).toBe("abcd");
    expect(normalizeHex("0XFF00")).toBe("ff00");
  });
});

describe("serialization helpers", () => {
  it("covers scalar round-trips through the canonical methods", () => {
    const writer = new BinaryWriter();
    writer.writeUInt8(1);
    writer.writeUInt16LE(2);
    writer.writeUInt32LE(3);
    writer.writeUInt64LE(4n);
    writer.writeBool(true);
    writer.writeVarString("neo");
    writer.writeVarBytes(new Uint8Array([5, 6]));

    const reader = new BinaryReader(writer.toBytes());
    expect(reader.readUInt8()).toBe(1);
    expect(reader.readUInt16LE()).toBe(2);
    expect(reader.readUInt32LE()).toBe(3);
    expect(reader.readUInt64LE()).toBe(4n);
    expect(reader.readBool()).toBe(true);
    expect(reader.readVarString()).toBe("neo");
    expect(Array.from(reader.readVarBytes())).toEqual([5, 6]);
  });

  it("throws on invalid integer bounds and malformed data", () => {
    const writer = new BinaryWriter();
    expect(() => writer.writeUInt8(256)).toThrow();
    expect(() => writer.writeUInt16LE(-1)).toThrow();
    expect(() => writer.writeUInt32LE(Number.MAX_SAFE_INTEGER)).toThrow();
    expect(() => writer.writeUInt64LE(-1n)).toThrow();
    expect(() => writer.writeVarInt(-1)).toThrow();

    const reader = new BinaryReader(new Uint8Array([2]));
    expect(() => reader.readBool()).toThrow();
    expect(() => reader.read(4)).toThrow();
  });
});

describe("varint multi-byte encodings", () => {
  it("round-trips 2-byte varint (0xfd tag)", () => {
    const writer = new BinaryWriter();
    writer.writeVarInt(0x00fd);
    writer.writeVarInt(0xffff);

    const reader = new BinaryReader(writer.toBytes());
    expect(reader.readVarInt()).toBe(0xfdn);
    expect(reader.readVarInt()).toBe(0xffffn);
  });

  it("round-trips 4-byte varint (0xfe tag)", () => {
    const writer = new BinaryWriter();
    writer.writeVarInt(0x10000);
    writer.writeVarInt(0xffffffff);

    const reader = new BinaryReader(writer.toBytes());
    expect(reader.readVarInt()).toBe(0x10000n);
    expect(reader.readVarInt()).toBe(0xffffffffn);
  });

  it("round-trips 8-byte varint (0xff tag)", () => {
    const writer = new BinaryWriter();
    writer.writeVarInt(0x100000000n);

    const reader = new BinaryReader(writer.toBytes());
    expect(reader.readVarInt()).toBe(0x100000000n);
  });

  it("readMultiple throws when count exceeds remaining bytes", () => {
    const writer = new BinaryWriter();
    writer.writeVarInt(999);

    const reader = new BinaryReader(writer.toBytes());
    expect(() => reader.readMultiple({ unmarshalFrom: (r: BinaryReader) => r.readUInt8() })).toThrow(
      /count 999 exceeds remaining/,
    );
  });
});
