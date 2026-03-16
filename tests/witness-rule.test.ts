import { describe, expect, it } from "vitest";
import {
  AndCondition,
  BooleanCondition,
  CalledByContractCondition,
  CalledByEntryCondition,
  CalledByGroupCondition,
  GroupCondition,
  H160,
  PrivateKey,
  ScriptHashCondition,
  WitnessRule,
  WitnessRuleAction,
  deserialize,
  serialize
} from "../src/index.js";

describe("witness rules", () => {
  it("serializes and deserializes the full witness condition set", () => {
    const privateKey = new PrivateKey(
      "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
    );
    const publicKey = privateKey.publicKey();

    const rule = new WitnessRule(WitnessRuleAction.Allow, [
      new BooleanCondition(true),
      new AndCondition([
        new ScriptHashCondition(new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf")),
        new GroupCondition(publicKey),
        new CalledByEntryCondition(),
        new CalledByContractCondition(new H160("0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5")),
        new CalledByGroupCondition(publicKey)
      ])
    ]);

    const decoded = deserialize(serialize(rule), WitnessRule);
    expect(decoded.to_json()).toEqual(rule.to_json());
  });
});
