import { createHash } from "node:crypto";
import { bytesToBase64, encodeUInt32LE } from "../internal/bytes.js";
import { H160, H256 } from "./hash.js";
import { PublicKey } from "./keypair.js";
import { BinaryReader, BinaryWriter, serialize } from "./serializing.js";
import { Witness, WitnessScope, witnessScopeName } from "./witness.js";
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

export type TxAttributeJson =
  | HighPriorityAttributeJson
  | OracleResponseAttributeJson
  | NotValidBeforeAttributeJson
  | ConflictsAttributeJson
  | NotaryAssistedAttributeJson;

function sha256(data: Uint8Array): Uint8Array {
  return createHash("sha256").update(data).digest();
}

export class Signer {
  public readonly account: H160;
  public readonly scopes: WitnessScope;
  public readonly allowedContracts: H160[];
  public readonly allowedGroups: PublicKey[];
  public readonly rules: WitnessRule[];

  public constructor({
    account,
    scopes,
    allowedContracts = [],
    allowedGroups = [],
    rules = [],
  }: {
    account: H160 | string;
    scopes: WitnessScope;
    allowedContracts?: (H160 | string)[];
    allowedGroups?: (PublicKey | string)[];
    rules?: WitnessRule[];
  }) {
    this.account = typeof account === "string" ? new H160(account) : account;
    this.scopes = scopes;
    this.allowedContracts = allowedContracts.map((contract) =>
      typeof contract === "string" ? new H160(contract) : contract,
    );
    this.allowedGroups = allowedGroups.map((group) => (typeof group === "string" ? new PublicKey(group) : group));
    this.rules = rules;
  }

  public toJSON(): SignerJson {
    return {
      account: this.account.toString(),
      scopes: witnessScopeName(this.scopes),
      allowedcontracts: this.allowedContracts.map((contract) => contract.toString()),
      allowedgroups: this.allowedGroups.map((group) => group.toString()),
      rules: this.rules.map((rule) => rule.toJSON()),
    };
  }

  public marshalTo(writer: BinaryWriter): void {
    this.account.marshalTo(writer);
    writer.writeUInt8(this.scopes);
    if (this.scopes & WitnessScope.CustomContracts) {
      writer.writeMultiple(this.allowedContracts);
    }
    if (this.scopes & WitnessScope.CustomGroups) {
      writer.writeMultiple(this.allowedGroups);
    }
    if (this.scopes & WitnessScope.WitnessRules) {
      writer.writeMultiple(this.rules);
    }
  }

  public static unmarshalFrom(reader: BinaryReader): Signer {
    const account = H160.unmarshalFrom(reader);
    const scopes = reader.readUInt8() as WitnessScope;
    const allowedContracts = scopes & WitnessScope.CustomContracts ? reader.readMultiple(H160) : [];
    const allowedGroups = scopes & WitnessScope.CustomGroups ? reader.readMultiple(PublicKey) : [];
    const rules = scopes & WitnessScope.WitnessRules ? reader.readMultiple(WitnessRule) : [];
    return new Signer({ account, scopes, allowedContracts, allowedGroups, rules });
  }
}

export enum TxAttributeType {
  HighPriority = 0x01,
  OracleResponse = 0x11,
  NotValidBefore = 0x20,
  Conflicts = 0x21,
  NotaryAssisted = 0x22,
}

export enum OracleResponseCode {
  Success = 0x00,
  ProtocolNotSupported = 0x10,
  ConsensusUnreachable = 0x12,
  NotFound = 0x14,
  Timeout = 0x16,
  Forbidden = 0x18,
  ResponseTooLarge = 0x1a,
  InsufficientFunds = 0x1c,
  ContentTypeNotSupported = 0x1f,
  Error = 0xff,
}

export class TxAttribute {
  public constructor(public readonly type: TxAttributeType) {}

  public marshalTo(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
  }

  public static unmarshalFrom(reader: BinaryReader): TxAttribute {
    const type = reader.readUInt8() as TxAttributeType;
    switch (type) {
      case TxAttributeType.HighPriority:
        return new HighPriorityAttribute();
      case TxAttributeType.OracleResponse:
        return new OracleResponseAttribute(
          reader.readUInt64LE(),
          reader.readUInt8() as OracleResponseCode,
          reader.readVarBytes(),
        );
      case TxAttributeType.NotValidBefore:
        return new NotValidBeforeAttribute(reader.readUInt32LE());
      case TxAttributeType.Conflicts:
        return new ConflictsAttribute(H256.unmarshalFrom(reader));
      case TxAttributeType.NotaryAssisted:
        return new NotaryAssistedAttribute(reader.readUInt8());
      default:
        throw new Error(`unexpected TxAttributeType: ${type}`);
    }
  }

  public toJSON(): TxAttributeJson {
    return { type: TxAttributeType[this.type] as TxAttributeJson["type"] } as TxAttributeJson;
  }
}

export class HighPriorityAttribute extends TxAttribute {
  public constructor() {
    super(TxAttributeType.HighPriority);
  }

  public override toJSON(): HighPriorityAttributeJson {
    return { type: "HighPriority" };
  }
}

export class OracleResponseAttribute extends TxAttribute {
  public constructor(
    public readonly id: bigint,
    public readonly code: OracleResponseCode,
    public readonly result: Uint8Array,
  ) {
    super(TxAttributeType.OracleResponse);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    writer.writeUInt64LE(this.id);
    writer.writeUInt8(this.code);
    writer.writeVarBytes(this.result);
  }

  public override toJSON(): OracleResponseAttributeJson {
    return {
      type: "OracleResponse",
      id: this.id.toString(),
      code: OracleResponseCode[this.code],
      result: bytesToBase64(this.result),
    };
  }
}

export class NotValidBeforeAttribute extends TxAttribute {
  public constructor(public readonly height: number) {
    super(TxAttributeType.NotValidBefore);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    writer.writeUInt32LE(this.height);
  }

  public override toJSON(): NotValidBeforeAttributeJson {
    return { type: "NotValidBefore", height: this.height };
  }
}

export class ConflictsAttribute extends TxAttribute {
  public constructor(public readonly hash: H256) {
    super(TxAttributeType.Conflicts);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    this.hash.marshalTo(writer);
  }

  public override toJSON(): ConflictsAttributeJson {
    return { type: "Conflicts", hash: this.hash.toString() };
  }
}

export class NotaryAssistedAttribute extends TxAttribute {
  public constructor(public readonly nKeys: number) {
    super(TxAttributeType.NotaryAssisted);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    writer.writeUInt8(this.nKeys);
  }

  public override toJSON(): NotaryAssistedAttributeJson {
    return { type: "NotaryAssisted", nkeys: this.nKeys };
  }
}

export class Tx {
  public readonly version = 0;
  public nonce: number;
  public systemFee: bigint;
  public networkFee: bigint;
  public validUntilBlock: number;
  public script: Uint8Array;
  public signers: Signer[];
  public attributes: TxAttribute[];
  public witnesses: Witness[];

  public constructor({
    nonce,
    systemFee,
    networkFee,
    validUntilBlock,
    script,
    signers = [],
    witnesses = [],
    attributes = [],
  }: {
    nonce: number;
    systemFee: bigint | number;
    networkFee: bigint | number;
    validUntilBlock: number;
    script: Uint8Array;
    signers?: Signer[];
    witnesses?: Witness[];
    attributes?: TxAttribute[];
  }) {
    this.nonce = nonce;
    this.systemFee = BigInt(systemFee);
    this.networkFee = BigInt(networkFee);
    this.validUntilBlock = validUntilBlock;
    this.script = script;
    this.signers = signers;
    this.attributes = attributes;
    this.witnesses = witnesses;
  }

  public getSignData(networkId: number): Uint8Array {
    const writer = new BinaryWriter();
    this.marshalUnsignedTo(writer);
    const digest = sha256(writer.toBytes());
    return new Uint8Array([...encodeUInt32LE(networkId), ...digest]);
  }

  public marshalUnsignedTo(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt32LE(this.nonce);
    writer.writeUInt64LE(this.systemFee);
    writer.writeUInt64LE(this.networkFee);
    writer.writeUInt32LE(this.validUntilBlock);
    writer.writeMultiple(this.signers);
    writer.writeMultiple(this.attributes);
    writer.writeVarBytes(this.script);
  }

  public marshalTo(writer: BinaryWriter): void {
    this.marshalUnsignedTo(writer);
    writer.writeMultiple(this.witnesses);
  }

  public static unmarshalFrom(reader: BinaryReader): Tx {
    const version = reader.readUInt8();
    if (version !== 0) {
      throw new Error(`unexpected tx version: ${version}`);
    }
    return new Tx({
      nonce: reader.readUInt32LE(),
      systemFee: reader.readUInt64LE(),
      networkFee: reader.readUInt64LE(),
      validUntilBlock: reader.readUInt32LE(),
      signers: reader.readMultiple(Signer),
      attributes: reader.readMultiple(TxAttribute),
      script: reader.readVarBytes(),
      witnesses: reader.readMultiple(Witness),
    });
  }

  public toBytes(): Uint8Array {
    return serialize(this);
  }

  public toJSON(): {
    version: number;
    nonce: number;
    sysfee: string;
    netfee: string;
    validuntilblock: number;
    script: string;
    signers: SignerJson[];
    attributes: TxAttributeJson[];
    witnesses: ReturnType<Witness["toJSON"]>[];
  } {
    return {
      version: this.version,
      nonce: this.nonce,
      sysfee: this.systemFee.toString(),
      netfee: this.networkFee.toString(),
      validuntilblock: this.validUntilBlock,
      script: bytesToBase64(this.script),
      signers: this.signers.map((signer) => signer.toJSON()),
      attributes: this.attributes.map((attribute) => attribute.toJSON()),
      witnesses: this.witnesses.map((witness) => witness.toJSON()),
    };
  }
}
