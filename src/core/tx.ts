import { createHash } from "node:crypto";
import { bytesToBase64, bytesToHex } from "../internal/bytes.js";
import { H160, H256 } from "./hash.js";
import { PublicKey } from "./keypair.js";
import { BinaryReader, BinaryWriter, serialize } from "./serializing.js";
import { Witness, WitnessScope, witnessScopeName } from "./witness.js";
import { WitnessRule } from "./witness-rule.js";

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
    rules = []
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
      typeof contract === "string" ? new H160(contract) : contract
    );
    this.allowedGroups = allowedGroups.map((group) =>
      typeof group === "string" ? new PublicKey(group) : group
    );
    this.rules = rules;
  }

  public toJSON(): {
    account: string;
    scopes: string;
    allowedcontracts: string[];
    allowedgroups: string[];
    rules: ReturnType<WitnessRule["toJSON"]>[];
  } {
    return {
      account: this.account.toString(),
      scopes: witnessScopeName(this.scopes),
      allowedcontracts: this.allowedContracts.map((contract) => contract.toString()),
      allowedgroups: this.allowedGroups.map((group) => group.toString()),
      rules: this.rules.map((rule) => rule.toJSON())
    };
  }

  public to_json(): {
    account: string;
    scopes: string;
    allowedcontracts: string[];
    allowedgroups: string[];
    rules: ReturnType<WitnessRule["toJSON"]>[];
  } {
    return this.toJSON();
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
  NotaryAssisted = 0x22
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
  Error = 0xff
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
        return new OracleResponseAttribute(reader.readUInt64LE(), reader.readUInt8() as OracleResponseCode, reader.readVarBytes());
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

  public toJSON(): { type: string } {
    return { type: TxAttributeType[this.type] };
  }

  public to_json(): { type: string } {
    return this.toJSON();
  }
}

export class HighPriorityAttribute extends TxAttribute {
  public constructor() {
    super(TxAttributeType.HighPriority);
  }
}

export class OracleResponseAttribute extends TxAttribute {
  public constructor(
    public readonly id: bigint,
    public readonly code: OracleResponseCode,
    public readonly result: Uint8Array
  ) {
    super(TxAttributeType.OracleResponse);
  }

  public override marshalTo(writer: BinaryWriter): void {
    super.marshalTo(writer);
    writer.writeUInt64LE(this.id);
    writer.writeUInt8(this.code);
    writer.writeVarBytes(this.result);
  }

  public override toJSON(): { type: string; id: string; code: string; result: string } {
    return {
      type: TxAttributeType[this.type],
      id: this.id.toString(),
      code: OracleResponseCode[this.code],
      result: bytesToBase64(this.result)
    };
  }

  public override to_json(): { type: string; id: string; code: string; result: string } {
    return this.toJSON();
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

  public override toJSON(): { type: string; height: number } {
    return { type: TxAttributeType[this.type], height: this.height };
  }

  public override to_json(): { type: string; height: number } {
    return this.toJSON();
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

  public override toJSON(): { type: string; hash: string } {
    return { type: TxAttributeType[this.type], hash: this.hash.toString() };
  }

  public override to_json(): { type: string; hash: string } {
    return this.toJSON();
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

  public override toJSON(): { type: string; nkeys: number } {
    return { type: TxAttributeType[this.type], nkeys: this.nKeys };
  }

  public override to_json(): { type: string; nkeys: number } {
    return this.toJSON();
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
    attributes = []
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
    const prefix = new Uint8Array(4);
    prefix[0] = networkId & 0xff;
    prefix[1] = (networkId >> 8) & 0xff;
    prefix[2] = (networkId >> 16) & 0xff;
    prefix[3] = (networkId >> 24) & 0xff;
    return new Uint8Array([...prefix, ...digest]);
  }

  public get_sign_data(networkId: number): Uint8Array {
    return this.getSignData(networkId);
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

  public marshal_unsigned_to(writer: BinaryWriter): void {
    this.marshalUnsignedTo(writer);
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
      witnesses: reader.readMultiple(Witness)
    });
  }

  public toBytes(): Uint8Array {
    return serialize(this);
  }

  public to_bytes(): Uint8Array {
    return this.toBytes();
  }

  public toJSON(): {
    version: number;
    nonce: number;
    sysfee: string;
    netfee: string;
    validuntilblock: number;
    script: string;
    signers: ReturnType<Signer["toJSON"]>[];
    attributes: ReturnType<TxAttribute["toJSON"]>[];
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
      witnesses: this.witnesses.map((witness) => witness.toJSON())
    };
  }

  public to_json(): {
    version: number;
    nonce: number;
    sysfee: string;
    netfee: string;
    validuntilblock: number;
    script: string;
    signers: ReturnType<Signer["toJSON"]>[];
    attributes: ReturnType<TxAttribute["toJSON"]>[];
    witnesses: ReturnType<Witness["toJSON"]>[];
  } {
    return this.toJSON();
  }
}
