import { H160 } from "./hash.js";
import { PublicKey } from "./keypair.js";
export var WitnessRuleAction;
(function (WitnessRuleAction) {
    WitnessRuleAction[WitnessRuleAction["Deny"] = 0] = "Deny";
    WitnessRuleAction[WitnessRuleAction["Allow"] = 1] = "Allow";
})(WitnessRuleAction || (WitnessRuleAction = {}));
export var WitnessConditionType;
(function (WitnessConditionType) {
    WitnessConditionType[WitnessConditionType["Boolean"] = 0] = "Boolean";
    WitnessConditionType[WitnessConditionType["Not"] = 1] = "Not";
    WitnessConditionType[WitnessConditionType["And"] = 2] = "And";
    WitnessConditionType[WitnessConditionType["Or"] = 3] = "Or";
    WitnessConditionType[WitnessConditionType["ScriptHash"] = 24] = "ScriptHash";
    WitnessConditionType[WitnessConditionType["Group"] = 25] = "Group";
    WitnessConditionType[WitnessConditionType["CalledByEntry"] = 32] = "CalledByEntry";
    WitnessConditionType[WitnessConditionType["CalledByContract"] = 40] = "CalledByContract";
    WitnessConditionType[WitnessConditionType["CalledByGroup"] = 41] = "CalledByGroup";
})(WitnessConditionType || (WitnessConditionType = {}));
export class WitnessCondition {
    type;
    constructor(type) {
        this.type = type;
    }
    marshalTo(writer) {
        writer.writeUInt8(this.type);
    }
    static unmarshalFrom(reader) {
        const type = reader.readUInt8();
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
    toJSON() {
        return { type: WitnessConditionType[this.type] };
    }
}
export class BooleanCondition extends WitnessCondition {
    expression;
    constructor(expression) {
        super(WitnessConditionType.Boolean);
        this.expression = expression;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        writer.writeBool(this.expression);
    }
    toJSON() {
        return { type: "Boolean", expression: this.expression };
    }
}
export class NotCondition extends WitnessCondition {
    expression;
    constructor(expression) {
        super(WitnessConditionType.Not);
        this.expression = expression;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        this.expression.marshalTo(writer);
    }
    toJSON() {
        return { type: "Not", expression: this.expression.toJSON() };
    }
}
export class AndCondition extends WitnessCondition {
    expressions;
    constructor(expressions) {
        super(WitnessConditionType.And);
        this.expressions = expressions;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        writer.writeMultiple(this.expressions);
    }
    toJSON() {
        return { type: "And", expressions: this.expressions.map((expression) => expression.toJSON()) };
    }
}
export class OrCondition extends WitnessCondition {
    expressions;
    constructor(expressions) {
        super(WitnessConditionType.Or);
        this.expressions = expressions;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        writer.writeMultiple(this.expressions);
    }
    toJSON() {
        return { type: "Or", expressions: this.expressions.map((expression) => expression.toJSON()) };
    }
}
export class ScriptHashCondition extends WitnessCondition {
    hash;
    constructor(hash) {
        super(WitnessConditionType.ScriptHash);
        this.hash = hash;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        this.hash.marshalTo(writer);
    }
    toJSON() {
        return { type: "ScriptHash", hash: this.hash.toString() };
    }
}
export class GroupCondition extends WitnessCondition {
    group;
    constructor(group) {
        super(WitnessConditionType.Group);
        this.group = group;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        this.group.marshalTo(writer);
    }
    toJSON() {
        return { type: "Group", group: this.group.toString() };
    }
}
export class CalledByEntryCondition extends WitnessCondition {
    constructor() {
        super(WitnessConditionType.CalledByEntry);
    }
    toJSON() {
        return { type: "CalledByEntry" };
    }
}
export class CalledByContractCondition extends WitnessCondition {
    hash;
    constructor(hash) {
        super(WitnessConditionType.CalledByContract);
        this.hash = hash;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        this.hash.marshalTo(writer);
    }
    toJSON() {
        return { type: "CalledByContract", hash: this.hash.toString() };
    }
}
export class CalledByGroupCondition extends WitnessCondition {
    group;
    constructor(group) {
        super(WitnessConditionType.CalledByGroup);
        this.group = group;
    }
    marshalTo(writer) {
        super.marshalTo(writer);
        this.group.marshalTo(writer);
    }
    toJSON() {
        return { type: "CalledByGroup", group: this.group.toString() };
    }
}
export class WitnessRule {
    action;
    conditions;
    constructor(action, conditions) {
        this.action = action;
        this.conditions = conditions;
    }
    marshalTo(writer) {
        writer.writeUInt8(this.action);
        writer.writeMultiple(this.conditions);
    }
    static unmarshalFrom(reader) {
        const action = reader.readUInt8();
        if (!Object.values(WitnessRuleAction).includes(action)) {
            throw new Error(`unexpected WitnessRuleAction: ${action}`);
        }
        return new WitnessRule(action, reader.readMultiple(WitnessCondition));
    }
    toJSON() {
        return {
            action: this.action === WitnessRuleAction.Allow ? "Allow" : "Deny",
            conditions: this.conditions.map((condition) => condition.toJSON())
        };
    }
}
