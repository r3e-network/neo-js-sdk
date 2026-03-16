import { describe, expect, it } from "vitest";
import {
  BinaryWriter,
  Block,
  CalledByContractCondition,
  CalledByEntryCondition,
  CalledByGroupCondition,
  H160,
  H256,
  Header,
  PrivateKey,
  TrimmedBlock,
  Witness,
  WitnessRule,
  WitnessRuleAction,
  WitnessScope,
  witnessScopeName
} from "../src/index.js";

describe("witness and block aliases", () => {
  it("covers witness getters, json aliases, and scope names", () => {
    const witness = new Witness(new Uint8Array([1, 2]), new Uint8Array([3, 4]));

    expect(witness.invocationScript).toEqual(new Uint8Array([1, 2]));
    expect(witness.verificationScript).toEqual(new Uint8Array([3, 4]));
    expect(witness.to_json()).toEqual(witness.toJSON());
    expect(witnessScopeName(WitnessScope.NONE)).toBe("None");
    expect(witnessScopeName(WitnessScope.CustomContracts | WitnessScope.CustomGroups | WitnessScope.Global)).toBe(
      "CustomContracts,CustomGroups,Global"
    );
  });

  it("covers witness-rule alias json on remaining condition variants", () => {
    const key = new PrivateKey(
      "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
    ).publicKey();

    const conditions = [
      new CalledByEntryCondition(),
      new CalledByContractCondition(new H160("0xd2a4cff31913016155e38e474a2c06d08be276cf")),
      new CalledByGroupCondition(key)
    ];
    const rule = new WitnessRule(WitnessRuleAction.Deny, conditions);

    expect(conditions.map((condition) => condition.to_json())).toEqual([
      { type: "CalledByEntry" },
      {
        type: "CalledByContract",
        hash: "0xd2a4cff31913016155e38e474a2c06d08be276cf"
      },
      {
        type: "CalledByGroup",
        group: key.toString()
      }
    ]);
    expect(rule.to_json()).toEqual({
      action: "Deny",
      conditions: conditions.map((condition) => condition.to_json())
    });
  });

  it("covers header and trimmed block alias helpers", () => {
    const witness = new Witness(new Uint8Array([1]), new Uint8Array([2]));
    const header = new Header({
      version: 0,
      previousBlockHash: new H256(),
      merkleRoot: new H256(),
      unixMillis: 1,
      nonce: 2,
      index: 3,
      primaryIndex: 4,
      nextConsensus: new H160(),
      witness
    });
    const block = new Block(header, []);
    const trimmed = new TrimmedBlock(header, [new H256()]);

    expect(header.time).toBe(1n);
    expect(header.get_sign_data(894710606)).toEqual(header.getSignData(894710606));
    const marshalWriter = new BinaryWriter();
    header.marshal_unsigned_to(marshalWriter);
    expect(marshalWriter.to_bytes().length).toBeGreaterThan(0);
    expect(header.to_bytes()).toEqual(header.toBytes());
    expect(header.to_json()).toEqual(header.toJSON());
    expect(block.to_json()).toEqual(block.toJSON());
    expect(trimmed.to_json()).toEqual(trimmed.toJSON());
  });
});
