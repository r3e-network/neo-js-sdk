import { describe, expect, it } from "vitest";
import { ScriptBuilder } from "../src/index.js";

describe("script builder edge cases", () => {
  it("encodes large integer widths and byte lengths", () => {
    const bigIntScript = new ScriptBuilder().emit_push(2n ** 120n).to_bytes();
    const bytes256 = new Uint8Array(256).fill(1);
    const bytesScript = new ScriptBuilder().emit_push(bytes256).to_bytes();

    expect(bigIntScript.length).toBeGreaterThan(0);
    expect(bytesScript[0]).not.toBeUndefined();
  });

  it("rejects unsupported push items", () => {
    expect(() => new ScriptBuilder().emit_push(Symbol("bad") as never)).toThrow();
  });
});
