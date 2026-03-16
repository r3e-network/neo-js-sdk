import { describe, expect, it } from "vitest";
import { ScriptBuilder } from "../src/index.js";

describe("script builder edge cases", () => {
  it("encodes large integer widths and byte lengths", () => {
    const bigIntScript = new ScriptBuilder().emit_push(2n ** 120n).to_bytes();
    const bytes256 = new Uint8Array(256).fill(1);
    const bytes65536 = new Uint8Array(65536).fill(2);
    const bytesScript = new ScriptBuilder().emit_push(bytes256).to_bytes();
    const bytesScriptLarge = new ScriptBuilder().emit_push(bytes65536).to_bytes();
    const int256Script = new ScriptBuilder().emit_push(2n ** 250n).to_bytes();

    expect(bigIntScript.length).toBeGreaterThan(0);
    expect(bytesScript[0]).not.toBeUndefined();
    expect(bytesScriptLarge[0]).not.toBeUndefined();
    expect(int256Script.length).toBeGreaterThan(0);
  });

  it("rejects unsupported push items", () => {
    expect(() => new ScriptBuilder().emit_push(Symbol("bad") as never)).toThrow();
    expect(() =>
      (new ScriptBuilder() as unknown as { emitPushBytes(value: { length: number }): void }).emitPushBytes({
        length: 0x100000000
      })
    ).toThrow(/push too large bytes/);
  });
});
