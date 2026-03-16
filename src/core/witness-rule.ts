import { H160 } from "./hash.js";
import { PublicKey } from "./keypair.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";

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

  public toJSON(): { type: string } {
    return { type: WitnessConditionType[this.type] };
  }

  public to_json(): { type: string } {
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

  public override toJSON(): { type: string; expression: boolean } {
    return { type: WitnessConditionType[this.type], expression: this.expression };
  }

  public override to_json(): { type: string; expression: boolean } {
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

  public override toJSON(): { type: string; expression: ReturnType<WitnessCondition["toJSON"]> } {
    return { type: WitnessConditionType[this.type], expression: this.expression.toJSON() };
  }

  public override to_json(): { type: string; expression: ReturnType<WitnessCondition["toJSON"]> } {
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

  public override toJSON(): { type: string; expressions: ReturnType<WitnessCondition["toJSON"]>[] } {
    return { type: WitnessConditionType[this.type], expressions: this.expressions.map((expression) => expression.toJSON()) };
  }

  public override to_json(): { type: string; expressions: ReturnType<WitnessCondition["toJSON"]>[] } {
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

  public override toJSON(): { type: string; expressions: ReturnType<WitnessCondition["toJSON"]>[] } {
    return { type: WitnessConditionType[this.type], expressions: this.expressions.map((expression) => expression.toJSON()) };
  }

  public override to_json(): { type: string; expressions: ReturnType<WitnessCondition["toJSON"]>[] } {
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

  public override toJSON(): { type: string; hash: string } {
    return { type: WitnessConditionType[this.type], hash: this.hash.toString() };
  }

  public override to_json(): { type: string; hash: string } {
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

  public override toJSON(): { type: string; group: string } {
    return { type: WitnessConditionType[this.type], group: this.group.toString() };
  }

  public override to_json(): { type: string; group: string } {
    return this.toJSON();
  }
}

export class CalledByEntryCondition extends WitnessCondition {
  public constructor() {
    super(WitnessConditionType.CalledByEntry);
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

  public override toJSON(): { type: string; hash: string } {
    return { type: WitnessConditionType[this.type], hash: this.hash.toString() };
  }

  public override to_json(): { type: string; hash: string } {
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

  public override toJSON(): { type: string; group: string } {
    return { type: WitnessConditionType[this.type], group: this.group.toString() };
  }

  public override to_json(): { type: string; group: string } {
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

  public toJSON(): { action: string; conditions: ReturnType<WitnessCondition["toJSON"]>[] } {
    return {
      action: WitnessRuleAction[this.action],
      conditions: this.conditions.map((condition) => condition.toJSON())
    };
  }

  public to_json(): { action: string; conditions: ReturnType<WitnessCondition["toJSON"]>[] } {
    return this.toJSON();
  }
}
