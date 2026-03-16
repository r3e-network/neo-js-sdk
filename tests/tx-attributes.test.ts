import { describe, expect, it } from "vitest";
import {
  ConflictsAttribute,
  H256,
  HighPriorityAttribute,
  NotValidBeforeAttribute,
  NotaryAssistedAttribute,
  OracleResponseAttribute,
  OracleResponseCode,
  TxAttribute,
  deserialize,
  serialize
} from "../src/index.js";

describe("transaction attributes", () => {
  it("round-trips all supported tx attribute variants", () => {
    const attributes = [
      new HighPriorityAttribute(),
      new OracleResponseAttribute(1n, OracleResponseCode.Success, new Uint8Array([1, 2])),
      new NotValidBeforeAttribute(123),
      new ConflictsAttribute(new H256("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")),
      new NotaryAssistedAttribute(4)
    ];

    for (const attribute of attributes) {
      const decoded = deserialize(serialize(attribute), TxAttribute);
      expect(decoded.to_json()).toEqual(attribute.to_json());
    }
  });
});
