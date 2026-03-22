import { describe, expect, it } from "vitest";
import {
  buildStackParser,
  parseInvokeStack,
  parseStackItemArray,
  parseStackItemBoolean,
  parseStackItemBytes,
  parseStackItemInteger,
  parseStackItemMap,
  parseStackItemStruct,
  parseStackItemUtf8,
} from "../src/index.js";

describe("rpc stack parsers", () => {
  it("parses integer stack items as bigint", () => {
    expect(parseStackItemInteger({ type: "Integer", value: "42" })).toBe(42n);
  });

  it("parses byte strings and buffers from base64", () => {
    expect(parseStackItemBytes({ type: "ByteString", value: "AQI=" })).toEqual(new Uint8Array([1, 2]));
    expect(parseStackItemUtf8({ type: "Buffer", value: "aGVsbG8=" })).toBe("hello");
  });

  it("parses booleans and maps", () => {
    expect(parseStackItemBoolean({ type: "Boolean", value: true })).toBe(true);
    expect(
      parseStackItemMap({
        type: "Map",
        value: [
          {
            key: { type: "Integer", value: "1" },
            value: { type: "ByteString", value: "aGVsbG8=" },
          },
        ],
      }),
    ).toEqual([
      {
        key: { type: "Integer", value: "1" },
        value: { type: "ByteString", value: "aGVsbG8=" },
      },
    ]);
  });

  it("builds invoke result parsers with arity validation", () => {
    const parser = buildStackParser(parseStackItemInteger, parseStackItemUtf8);
    const result = parser({
      script: "",
      state: "HALT",
      gasconsumed: "1",
      stack: [
        { type: "Integer", value: "5" },
        { type: "ByteString", value: "aGVsbG8=" },
      ],
    });

    expect(result).toEqual([5n, "hello"]);
    expect(() =>
      parseInvokeStack(
        {
          script: "",
          state: "HALT",
          gasconsumed: "1",
          stack: [{ type: "Integer", value: "5" }],
        },
        parseStackItemInteger,
        parseStackItemUtf8,
      ),
    ).toThrow(/Wrong number of items/);
  });

  it("parseStackItemArray extracts Array items", () => {
    const result = parseStackItemArray({
      type: "Array",
      value: [
        { type: "Integer", value: "1" },
        { type: "Boolean", value: true },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: "Integer", value: "1" });
    expect(result[1]).toEqual({ type: "Boolean", value: true });
  });

  it("parseStackItemStruct extracts Struct items", () => {
    const result = parseStackItemStruct({
      type: "Struct",
      value: [{ type: "Integer", value: "42" }],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "Integer", value: "42" });
  });

  it("parseStackItemBytes throws on invalid type", () => {
    expect(() => parseStackItemBytes({ type: "Integer", value: "42" })).toThrow(/ByteString or Buffer/);
  });

  it("parseStackItemArray throws on wrong type", () => {
    expect(() => parseStackItemArray({ type: "Integer", value: "42" })).toThrow(/Expected stack item type Array/);
  });

  it("parseStackItemStruct throws on wrong type", () => {
    expect(() => parseStackItemStruct({ type: "Boolean", value: true })).toThrow(/Expected stack item type Struct/);
  });
});
