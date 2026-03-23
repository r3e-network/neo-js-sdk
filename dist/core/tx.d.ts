import { H160, H256 } from "./hash.js";
import { PublicKey } from "./keypair.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";
import { Witness, WitnessScope } from "./witness.js";
import { WitnessRule, type WitnessRuleJson } from "./witness-rule.js";
export interface SignerJson {
    account: string;
    scopes: string;
    allowedcontracts: string[];
    allowedgroups: string[];
    rules: WitnessRuleJson[];
}
export interface BaseTxAttributeJson {
    type: string;
}
export interface HighPriorityAttributeJson {
    type: "HighPriority";
}
export interface OracleResponseAttributeJson {
    type: "OracleResponse";
    id: string;
    code: string;
    result: string;
}
export interface NotValidBeforeAttributeJson {
    type: "NotValidBefore";
    height: number;
}
export interface ConflictsAttributeJson {
    type: "Conflicts";
    hash: string;
}
export interface NotaryAssistedAttributeJson {
    type: "NotaryAssisted";
    nkeys: number;
}
export type TxAttributeJson = HighPriorityAttributeJson | OracleResponseAttributeJson | NotValidBeforeAttributeJson | ConflictsAttributeJson | NotaryAssistedAttributeJson;
export declare class Signer {
    readonly account: H160;
    readonly scopes: WitnessScope;
    readonly allowedContracts: H160[];
    readonly allowedGroups: PublicKey[];
    readonly rules: WitnessRule[];
    constructor({ account, scopes, allowedContracts, allowedGroups, rules, }: {
        account: H160 | string;
        scopes: WitnessScope;
        allowedContracts?: (H160 | string)[];
        allowedGroups?: (PublicKey | string)[];
        rules?: WitnessRule[];
    });
    toJSON(): SignerJson;
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): Signer;
}
export declare enum TxAttributeType {
    HighPriority = 1,
    OracleResponse = 17,
    NotValidBefore = 32,
    Conflicts = 33,
    NotaryAssisted = 34
}
export declare enum OracleResponseCode {
    Success = 0,
    ProtocolNotSupported = 16,
    ConsensusUnreachable = 18,
    NotFound = 20,
    Timeout = 22,
    Forbidden = 24,
    ResponseTooLarge = 26,
    InsufficientFunds = 28,
    ContentTypeNotSupported = 31,
    Error = 255
}
export declare class TxAttribute {
    readonly type: TxAttributeType;
    constructor(type: TxAttributeType);
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): TxAttribute;
    toJSON(): TxAttributeJson;
}
export declare class HighPriorityAttribute extends TxAttribute {
    constructor();
    toJSON(): HighPriorityAttributeJson;
}
export declare class OracleResponseAttribute extends TxAttribute {
    readonly id: bigint;
    readonly code: OracleResponseCode;
    readonly result: Uint8Array;
    constructor(id: bigint, code: OracleResponseCode, result: Uint8Array);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): OracleResponseAttributeJson;
}
export declare class NotValidBeforeAttribute extends TxAttribute {
    readonly height: number;
    constructor(height: number);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): NotValidBeforeAttributeJson;
}
export declare class ConflictsAttribute extends TxAttribute {
    readonly hash: H256;
    constructor(hash: H256);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): ConflictsAttributeJson;
}
export declare class NotaryAssistedAttribute extends TxAttribute {
    readonly nKeys: number;
    constructor(nKeys: number);
    marshalTo(writer: BinaryWriter): void;
    toJSON(): NotaryAssistedAttributeJson;
}
export declare class Tx {
    readonly version = 0;
    nonce: number;
    systemFee: bigint;
    networkFee: bigint;
    validUntilBlock: number;
    script: Uint8Array;
    signers: Signer[];
    attributes: TxAttribute[];
    witnesses: Witness[];
    constructor({ nonce, systemFee, networkFee, validUntilBlock, script, signers, witnesses, attributes, }: {
        nonce: number;
        systemFee: bigint | number;
        networkFee: bigint | number;
        validUntilBlock: number;
        script: Uint8Array;
        signers?: Signer[];
        witnesses?: Witness[];
        attributes?: TxAttribute[];
    });
    getSignData(networkId: number): Uint8Array;
    marshalUnsignedTo(writer: BinaryWriter): void;
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): Tx;
    static unmarshalUnsignedFrom(reader: BinaryReader): Tx;
    toBytes(): Uint8Array;
    toJSON(): {
        version: number;
        nonce: number;
        sysfee: string;
        netfee: string;
        validuntilblock: number;
        script: string;
        signers: SignerJson[];
        attributes: TxAttributeJson[];
        witnesses: ReturnType<Witness["toJSON"]>[];
    };
}
