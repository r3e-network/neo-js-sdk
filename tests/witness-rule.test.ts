import { describe, expect, it } from "vitest";
import {
  AndCondition,
  BooleanCondition,
  BinaryReader,
  CalledByContractCondition,
  CalledByEntryCondition,
  CalledByGroupCondition,
  GroupCondition,
  H160,
  OrCondition,
  PrivateKey,
  ScriptHashCondition,
  TxAttribute,
  WitnessRule,
  WitnessRuleAction,
  WitnessScope,
  witnessScopeName,
  deserialize,
  serialize,
} from "../src/index.js";

describe("witness rules", () => {
  it("serializes and deserializes the full witness condition set", () => {
    const privateKey = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6");
    const publicKey = privateKey.publicKey();

    const rule = new WitnessRule(WitnessRuleAction.Allow, [
      new BooleanCondition(true),
      new AndCondition([
        new ScriptHashCondition(new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf")),
        new GroupCondition(publicKey),
        new CalledByEntryCondition(),
        new CalledByContractCondition(new H160("0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5")),
        new CalledByGroupCondition(publicKey),
      ]),
    ]);

    const decoded = deserialize(serialize(rule), WitnessRule);
    expect(decoded.toJSON()).toEqual(rule.toJSON());
  });

  it("covers canonical serializers and scope none formatting", () => {
    const key = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6").publicKey();
    const scriptHash = new ScriptHashCondition(new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf"));
    const group = new GroupCondition(key);

    expect(scriptHash.toJSON()).toEqual({
      type: "ScriptHash",
      hash: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
    });
    expect(group.toJSON()).toEqual({
      type: "Group",
      group: key.toString(),
    });
    expect(witnessScopeName(WitnessScope.None)).toBe("None");
  });

  it("covers witness-rule json on remaining condition variants", () => {
    const key = new PrivateKey("f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6").publicKey();

    const conditions = [
      new CalledByEntryCondition(),
      new CalledByContractCondition(new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf")),
      new CalledByGroupCondition(key),
    ];
    const rule = new WitnessRule(WitnessRuleAction.Deny, conditions);

    expect(conditions.map((c) => c.toJSON())).toEqual([
      { type: "CalledByEntry" },
      { type: "CalledByContract", hash: "0xd2a4cff31913016155e38e474a2c06d08be276cf" },
      { type: "CalledByGroup", group: key.toString() },
    ]);
    expect(rule.toJSON()).toEqual({
      action: "Deny",
      conditions: conditions.map((c) => c.toJSON()),
    });
  });

  it("serializes and deserializes OrCondition", () => {
    const hash = new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf");

    const rule = new WitnessRule(WitnessRuleAction.Allow, [
      new OrCondition([new BooleanCondition(true), new ScriptHashCondition(hash)]),
    ]);

    const decoded = deserialize(serialize(rule), WitnessRule);
    const json = decoded.toJSON();
    expect(json).toEqual(rule.toJSON());
    expect(json.conditions[0].type).toBe("Or");
  });

  it("OrCondition.toJSON returns correct structure", () => {
    const hash = new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf");
    const or = new OrCondition([new BooleanCondition(false), new ScriptHashCondition(hash)]);

    expect(or.toJSON()).toEqual({
      type: "Or",
      expressions: [
        { type: "Boolean", expression: false },
        { type: "ScriptHash", hash: hash.toString() },
      ],
    });
  });

  it("throws on invalid witness rule discriminant", () => {
    const invalidRuleReader = new BinaryReader(new Uint8Array([0xff, 0x00]));
    expect(() => WitnessRule.unmarshalFrom(invalidRuleReader)).toThrow(/unexpected WitnessRuleAction/);
  });

  it("throws on invalid tx attribute discriminant", () => {
    const invalidAttrReader = new BinaryReader(new Uint8Array([0xff]));
    expect(() => TxAttribute.unmarshalFrom(invalidAttrReader)).toThrow(/unexpected TxAttributeType/);
  });
});
