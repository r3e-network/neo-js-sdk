import { sc } from "@cityofzion/neon-core";
import { describe, expect, it } from "vitest";
import {
  CallFlags,
  H160,
  OpCode,
  ScriptBuilder,
  bytesToHex,
  gasContractHash
} from "../src/index.js";

describe("ScriptBuilder", () => {
  it("emits the RET opcode as a single byte", () => {
    const script = new ScriptBuilder().emit(OpCode.RET).toBytes();
    expect(bytesToHex(script)).toBe("40");
  });

  it("matches neon-core contract call output", () => {
    const contractHash = gasContractHash();
    const args = ["from", "to", 1];

    const actual = new ScriptBuilder()
      .emitContractCall(contractHash, "transfer", CallFlags.All, args)
      .toBytes();

    const expected = new sc.ScriptBuilder()
      .emitContractCall({
        scriptHash: contractHash.toString(),
        operation: "transfer",
        args,
        callFlags: sc.CallFlags.All
      })
      .build();

    expect(bytesToHex(actual)).toBe(expected);
  });

  it("pushes typed hash values as raw bytes", () => {
    const hash = new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf");
    const script = new ScriptBuilder().emitPush(hash).toBytes();
    expect(bytesToHex(script).startsWith("0c14")).toBe(true);
  });
});
