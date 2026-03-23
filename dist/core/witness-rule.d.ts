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
export type WitnessConditionJson = BooleanConditionJson | NotConditionJson | AndConditionJson | OrConditionJson | ScriptHashConditionJson | GroupConditionJson | CalledByEntryConditionJson | CalledByContractConditionJson | CalledByGroupConditionJson;
export interface WitnessRuleJson {
    action: "Deny" | "Allow";
    conditions: WitnessConditionJson[];
}
export declare enum WitnessRuleAction {
    Deny = 0,
    Allow = 1
}
export declare enum WitnessConditionType {
    Boolean = 0,
    Not = 1,
    And = 2,
    Or = 3,
    ScriptHash = 24,
    Group = 25,
    CalledByEntry = 32,
    CalledByContract = 40,
    CalledByGroup = 41
}
export declare abstract class WitnessCondition {
    readonly type: WitnessConditionType;
    protected constructor(type: WitnessConditionType);
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): WitnessCondition;
    toJSON(): WitnessConditionJson;
}
export declare class BooleanCondition extends WitnessCondition {
    readonly expression: boolean;
    constructor(expression: boolean);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): BooleanConditionJson;
}
export declare class NotCondition extends WitnessCondition {
    readonly expression: WitnessCondition;
    constructor(expression: WitnessCondition);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): NotConditionJson;
}
export declare class AndCondition extends WitnessCondition {
    readonly expressions: WitnessCondition[];
    constructor(expressions: WitnessCondition[]);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): AndConditionJson;
}
export declare class OrCondition extends WitnessCondition {
    readonly expressions: WitnessCondition[];
    constructor(expressions: WitnessCondition[]);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): OrConditionJson;
}
export declare class ScriptHashCondition extends WitnessCondition {
    readonly hash: H160;
    constructor(hash: H160);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): ScriptHashConditionJson;
}
export declare class GroupCondition extends WitnessCondition {
    readonly group: PublicKey;
    constructor(group: PublicKey);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): GroupConditionJson;
}
export declare class CalledByEntryCondition extends WitnessCondition {
    constructor();
    toJSON(): CalledByEntryConditionJson;
}
export declare class CalledByContractCondition extends WitnessCondition {
    readonly hash: H160;
    constructor(hash: H160);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): CalledByContractConditionJson;
}
export declare class CalledByGroupCondition extends WitnessCondition {
    readonly group: PublicKey;
    constructor(group: PublicKey);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): CalledByGroupConditionJson;
}
export declare class WitnessRule {
    readonly action: WitnessRuleAction;
    readonly conditions: WitnessCondition[];
    constructor(action: WitnessRuleAction, conditions: WitnessCondition[]);
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): WitnessRule;
    toJSON(): WitnessRuleJson;
}
