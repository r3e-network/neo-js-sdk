import { H160 } from "./hash.js";
import { PublicKey } from "./keypair.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";

export interface BaseWitnessConditionJson {
  type: string;
}

export interface BooleanConditionJson {
  type: "Boolean";
  expression: boolean;
}

export interface NotConditionJson {
  type: "Not";
  expression: WitnessConditionJson;
}

export interface AndConditionJson {
  type: "And";
  expressions: WitnessConditionJson[];
}

export interface OrConditionJson {
  type: "Or";
  expressions: WitnessConditionJson[];
}

export interface ScriptHashConditionJson {
  type: "ScriptHash";
  hash: string;
}

export interface GroupConditionJson {
  type: "Group";
  group: string;
}

export interface CalledByEntryConditionJson {
  type: "CalledByEntry";
}

export interface CalledByContractConditionJson {
  type: "CalledByContract";
  hash: string;
}

export interface CalledByGroupConditionJson {
  type: "CalledByGroup";
  group: string;
}

export type WitnessConditionJson =
  | BooleanConditionJson
  | NotConditionJson
  | AndConditionJson
  | OrConditionJson
  | ScriptHashConditionJson
  | GroupConditionJson
  | CalledByEntryConditionJson
  | CalledByContractConditionJson
  | CalledByGroupConditionJson;

export interface WitnessRuleJson {
  action: "Deny" | "Allow";
  conditions: WitnessConditionJson[];
}

export enum WitnessRuleAction {
  Deny = 0x00,
  Allow = 0x01
}

export enum WitnessConditionType {
  Boolean = 0x00,
  Not = 0x01,
  And = 0x02,
  Or = 0x03,
  ScriptHash = 0x18,
  Group = 0x19,
  CalledByEntry = 0x20,
  CalledByContract = 0x28,
  CalledByGroup = 0x29
}

export abstract class WitnessCondition {
  protected constructor(public readonly type: WitnessConditionType) {}

  public marshalTo(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
  }

  public static unmarshalFrom(reader: BinaryReader): WitnessCondition {
    const type = reader.readUInt8() as WitnessConditionType;
    switch (type) {
      case WitnessConditionType.Boolean:
        return new BooleanCondition(reader.readBool());
      case WitnessConditionType.Not:
        return new NotCondition(WitnessCondition.unmarshalFrom(reader));
      case WitnessConditionType.And:
        return new AndCondition(reader.readMultiple(WitnessCondition));
      case WitnessConditionType.Or:
        return new OrCondition(reader.readMultiple(WitnessCondition));
      case WitnessConditionType.ScriptHash:
        return new ScriptHashCondition(H160.unmarshalFrom(reader));
      case WitnessConditionType.Group:
        return new GroupCondition(PublicKey.unmarshalFrom(reader));
      case WitnessConditionType.CalledByEntry:
        return new CalledByEntryCondition();
      case WitnessConditionType.CalledByContract:
        return new CalledByContractCondition(H160.unmarshalFrom(reader));
      case WitnessConditionType.CalledByGroup:
        return new CalledByGroupCondition(PublicKey.unmarshalFrom(reader));
      default:
        throw new Error(`unexpected WitnessConditionType: ${type}`);
    }
  }

  public toJSON(): WitnessConditionJson {
    return { type: WitnessConditionType[this.type] as WitnessConditionJson["type"] } as WitnessConditionJson;
  }

  public to_json(): WitnessConditionJson {
    return this.toJSON();
  }
}

export class BooleanCondition extends WitnessCondition {
  public constructor(public readonly expression: boolean) {
    super(WitnessConditionType.Boolean);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    writer.writeBool(this.expression);
  }

  public override toJSON(): BooleanConditionJson {
    return { type: "Boolean", expression: this.expression };
  }

  public override to_json(): BooleanConditionJson {
    return this.toJSON();
  }
}

export class NotCondition extends WitnessCondition {
  public constructor(public readonly expression: WitnessCondition) {
    super(WitnessConditionType.Not);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    this.expression.marshalTo(writer);
  }

  public override toJSON(): NotConditionJson {
    return { type: "Not", expression: this.expression.toJSON() };
  }

  public override to_json(): NotConditionJson {
    return this.toJSON();
  }
}

export class AndCondition extends WitnessCondition {
  public constructor(public readonly expressions: WitnessCondition[]) {
    super(WitnessConditionType.And);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    writer.writeMultiple(this.expressions);
  }

  public override toJSON(): AndConditionJson {
    return { type: "And", expressions: this.expressions.map((expression) => expression.toJSON()) };
  }

  public override to_json(): AndConditionJson {
    return this.toJSON();
  }
}

export class OrCondition extends WitnessCondition {
  public constructor(public readonly expressions: WitnessCondition[]) {
    super(WitnessConditionType.Or);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    writer.writeMultiple(this.expressions);
  }

  public override toJSON(): OrConditionJson {
    return { type: "Or", expressions: this.expressions.map((expression) => expression.toJSON()) };
  }

  public override to_json(): OrConditionJson {
    return this.toJSON();
  }
}

export class ScriptHashCondition extends WitnessCondition {
  public constructor(public readonly hash: H160) {
    super(WitnessConditionType.ScriptHash);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    this.hash.marshalTo(writer);
  }

  public override toJSON(): ScriptHashConditionJson {
    return { type: "ScriptHash", hash: this.hash.toString() };
  }

  public override to_json(): ScriptHashConditionJson {
    return this.toJSON();
  }
}

export class GroupCondition extends WitnessCondition {
  public constructor(public readonly group: PublicKey) {
    super(WitnessConditionType.Group);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    this.group.marshalTo(writer);
  }

  public override toJSON(): GroupConditionJson {
    return { type: "Group", group: this.group.toString() };
  }

  public override to_json(): GroupConditionJson {
    return this.toJSON();
  }
}

export class CalledByEntryCondition extends WitnessCondition {
  public constructor() {
    super(WitnessConditionType.CalledByEntry);
  }

  public override toJSON(): CalledByEntryConditionJson {
    return { type: "CalledByEntry" };
  }

  public override to_json(): CalledByEntryConditionJson {
    return this.toJSON();
  }
}

export class CalledByContractCondition extends WitnessCondition {
  public constructor(public readonly hash: H160) {
    super(WitnessConditionType.CalledByContract);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    this.hash.marshalTo(writer);
  }

  public override toJSON(): CalledByContractConditionJson {
    return { type: "CalledByContract", hash: this.hash.toString() };
  }

  public override to_json(): CalledByContractConditionJson {
    return this.toJSON();
  }
}

export class CalledByGroupCondition extends WitnessCondition {
  public constructor(public readonly group: PublicKey) {
    super(WitnessConditionType.CalledByGroup);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    this.group.marshalTo(writer);
  }

  public override toJSON(): CalledByGroupConditionJson {
    return { type: "CalledByGroup", group: this.group.toString() };
  }

  public override to_json(): CalledByGroupConditionJson {
    return this.toJSON();
  }
}

export class WitnessRule {
  public constructor(
    public readonly action: WitnessRuleAction,
    public readonly conditions: WitnessCondition[]
  ) {}

  public marshalTo(writer: BinaryWriter): void {
    writer.writeUInt8(this.action);
    writer.writeMultiple(this.conditions);
  }

  public static unmarshalFrom(reader: BinaryReader): WitnessRule {
    const action = reader.readUInt8() as WitnessRuleAction;
    if (!Object.values(WitnessRuleAction).includes(action)) {
      throw new Error(`unexpected WitnessRuleAction: ${action}`);
    }
    return new WitnessRule(action, reader.readMultiple(WitnessCondition));
  }

  public toJSON(): WitnessRuleJson {
    return {
      action: this.action === WitnessRuleAction.Allow ? "Allow" : "Deny",
      conditions: this.conditions.map((condition) => condition.toJSON())
    };
  }

  public to_json(): WitnessRuleJson {
    return this.toJSON();
  }
}
