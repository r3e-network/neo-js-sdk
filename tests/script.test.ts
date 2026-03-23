import { describe, expect, it } from "vitest";
import { CallFlags, H160, OpCode, ScriptBuilder, bytesToHex, gasContractHash } from "../src/index.js";

describe("ScriptBuilder", () => {
  it("emits the RET opcode as a single byte", () => {
    const script = new ScriptBuilder().emit(OpCode.RET).toBytes();
    expect(bytesToHex(script)).toBe("40");
  });

  it("matches neon-core contract call output", () => {
    const contractHash = gasContractHash();
    const args = ["from", "to", 1];

    const actual = new ScriptBuilder().emitContractCall(contractHash, "transfer", CallFlags.All, args).toBytes();
    expect(bytesToHex(actual)).toBe("110c02746f0c0466726f6d13c01f0c087472616e736665720c14cf76e28bd0062c4a478ee35561011319f3cfa4d241627d5b52");
  });

  it("pushes typed hash values as raw bytes", () => {
    const hash = new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf");
    const script = new ScriptBuilder().emitPush(hash).toBytes();
    expect(bytesToHex(script).startsWith("0c14")).toBe(true);
  });
});

describe("script builder edge cases", () => {
  it("encodes large integer widths and byte lengths", () => {
    const builder = new ScriptBuilder();
    const bigIntScript = builder.emitPush(2n ** 120n).toBytes();
    const bytes256 = new Uint8Array(256).fill(1);
    const bytes65536 = new Uint8Array(65536).fill(2);
    const bytesScript = new ScriptBuilder().emitPush(bytes256).toBytes();
    const bytesScriptLarge = new ScriptBuilder().emitPush(bytes65536).toBytes();
    const int256Script = new ScriptBuilder().emitPush(2n ** 250n).toBytes();

    expect(bigIntScript.length).toBeGreaterThan(16);
    expect(bytesScript[0]).toBeDefined();
    expect(bytesScriptLarge[0]).toBeDefined();
    expect(int256Script.length).toBeGreaterThan(32);
  });

  it("rejects unsupported push items", () => {
    expect(() => new ScriptBuilder().emitPush(Symbol("bad") as never)).toThrow();
    expect(() =>
      (new ScriptBuilder() as unknown as { emitPushBytes(value: { length: number }): void }).emitPushBytes({
        length: 0x100000000,
      }),
    ).toThrow(/push too large bytes/);
  });
});

describe("PUSHINT width paths", () => {
  it("emits PUSHINT8 for small integers outside -1..16", () => {
    const script = new ScriptBuilder().emitPush(17).toBytes();
    expect(script[0]).toBe(0x00); // PUSHINT8 opcode

    const scriptNeg = new ScriptBuilder().emitPush(-2).toBytes();
    expect(scriptNeg[0]).toBe(0x00); // PUSHINT8 opcode
  });

  it("emits PUSHINT16 for 2-byte integers", () => {
    const script = new ScriptBuilder().emitPush(256).toBytes();
    expect(script[0]).toBe(0x01); // PUSHINT16 opcode

    const scriptNeg = new ScriptBuilder().emitPush(-256).toBytes();
    expect(scriptNeg[0]).toBe(0x01); // PUSHINT16 opcode
  });

  it("emits PUSHINT32 for 4-byte integers", () => {
    const script = new ScriptBuilder().emitPush(65536).toBytes();
    expect(script[0]).toBe(0x02); // PUSHINT32 opcode
  });

  it("emits PUSHINT64 for 8-byte integers", () => {
    const script = new ScriptBuilder().emitPush(2n ** 32n).toBytes();
    expect(script[0]).toBe(0x03); // PUSHINT64 opcode
  });

  it("emits PUSHINT128 for 16-byte integers", () => {
    const script = new ScriptBuilder().emitPush(2n ** 64n).toBytes();
    expect(script[0]).toBe(0x04); // PUSHINT128 opcode
  });

  it("emits PUSHINT256 for 32-byte integers", () => {
    const script = new ScriptBuilder().emitPush(2n ** 128n).toBytes();
    expect(script[0]).toBe(0x05); // PUSHINT256 opcode
  });
});

describe("script helpers", () => {
  it("emitSyscall produces valid script and hex output", () => {
    const builder = new ScriptBuilder();
    const script = builder.emitSyscall(0x11223344, [1, "neo"]).toBytes();

    expect(script.length).toBeGreaterThan(0);
    expect(builder.toHex()).toMatch(/^[0-9a-f]+$/);
  });
});
