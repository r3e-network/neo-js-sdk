import { describe, expect, it } from "vitest";
import { BinaryReader, BinaryWriter } from "../src/index.js";

describe("serialization helpers", () => {
  it("covers alias methods and scalar round-trips", () => {
    const writer = new BinaryWriter();
    writer.write_uint8(1);
    writer.write_uint16_le(2);
    writer.write_uint32_le(3);
    writer.write_uint64_le(4n);
    writer.write_bool(true);
    writer.write_var_string("neo");
    writer.write_var_bytes(new Uint8Array([5, 6]));

    const reader = new BinaryReader(writer.to_bytes());
    expect(reader.read_uint8()).toBe(1);
    expect(reader.read_uint16_le()).toBe(2);
    expect(reader.read_uint32_le()).toBe(3);
    expect(reader.read_uint64_le()).toBe(4n);
    expect(reader.read_bool()).toBe(true);
    expect(reader.read_var_string()).toBe("neo");
    expect(Array.from(reader.read_var_bytes())).toEqual([5, 6]);
  });

  it("throws on invalid integer bounds and malformed data", () => {
    const writer = new BinaryWriter();
    expect(() => writer.write_uint8(256)).toThrow();
    expect(() => writer.write_uint16_le(-1)).toThrow();
    expect(() => writer.write_uint32_le(Number.MAX_SAFE_INTEGER)).toThrow();
    expect(() => writer.write_uint64_le(-1n)).toThrow();
    expect(() => writer.write_var_int(-1)).toThrow();

    const reader = new BinaryReader(new Uint8Array([2]));
    expect(() => reader.read_bool()).toThrow();
    expect(() => reader.read(4)).toThrow();
  });
});
