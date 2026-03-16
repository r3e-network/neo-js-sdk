import { createHash } from "node:crypto";
import { H160, H256 } from "./hash.js";
import { BinaryReader, BinaryWriter, serialize } from "./serializing.js";
import { Tx } from "./tx.js";
import { Witness } from "./witness.js";

export class Header {
  public readonly version: number;
  public readonly previousBlockHash: H256;
  public readonly merkleRoot: H256;
  public readonly unixMillis: bigint;
  public readonly nonce: number;
  public readonly index: number;
  public readonly primaryIndex: number;
  public readonly nextConsensus: H160;
  public readonly witness: Witness;

  public constructor({
    version,
    previousBlockHash,
    merkleRoot,
    unixMillis,
    nonce,
    index,
    primaryIndex,
    nextConsensus,
    witness
  }: {
    version: number;
    previousBlockHash: H256;
    merkleRoot: H256;
    unixMillis: bigint | number;
    nonce: number;
    index: number;
    primaryIndex: number;
    nextConsensus: H160;
    witness: Witness;
  }) {
    this.version = version;
    this.previousBlockHash = previousBlockHash;
    this.merkleRoot = merkleRoot;
    this.unixMillis = BigInt(unixMillis);
    this.nonce = nonce;
    this.index = index;
    this.primaryIndex = primaryIndex;
    this.nextConsensus = nextConsensus;
    this.witness = witness;
  }

  public get time(): bigint {
    return this.unixMillis;
  }

  public getSignData(networkId: number): Uint8Array {
    const writer = new BinaryWriter();
    this.marshalUnsignedTo(writer);
    const digest = createHash("sha256").update(writer.toBytes()).digest();
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
    writer.writeUInt32LE(this.version);
    this.previousBlockHash.marshalTo(writer);
    this.merkleRoot.marshalTo(writer);
    writer.writeUInt64LE(this.unixMillis);
    writer.writeUInt32LE(this.nonce);
    writer.writeUInt32LE(this.index);
    writer.writeUInt8(this.primaryIndex);
    this.nextConsensus.marshalTo(writer);
  }

  public marshal_unsigned_to(writer: BinaryWriter): void {
    this.marshalUnsignedTo(writer);
  }

  public marshalTo(writer: BinaryWriter): void {
    this.marshalUnsignedTo(writer);
    this.witness.marshalTo(writer);
  }

  public static unmarshalFrom(reader: BinaryReader): Header {
    return new Header({
      version: reader.readUInt32LE(),
      previousBlockHash: H256.unmarshalFrom(reader),
      merkleRoot: H256.unmarshalFrom(reader),
      unixMillis: reader.readUInt64LE(),
      nonce: reader.readUInt32LE(),
      index: reader.readUInt32LE(),
      primaryIndex: reader.readUInt8(),
      nextConsensus: H160.unmarshalFrom(reader),
      witness: Witness.unmarshalFrom(reader)
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
    previousblockhash: string;
    merkleroot: string;
    time: string;
    nonce: number;
    index: number;
    primaryindex: number;
    nextconsensus: string;
    witness: ReturnType<Witness["toJSON"]>;
  } {
    return {
      version: this.version,
      previousblockhash: this.previousBlockHash.toString(),
      merkleroot: this.merkleRoot.toString(),
      time: this.unixMillis.toString(),
      nonce: this.nonce,
      index: this.index,
      primaryindex: this.primaryIndex,
      nextconsensus: this.nextConsensus.toString(),
      witness: this.witness.toJSON()
    };
  }

  public to_json(): ReturnType<Header["toJSON"]> {
    return this.toJSON();
  }
}

export class Block {
  public constructor(
    public readonly header: Header,
    public readonly transactions: Tx[]
  ) {}

  public marshalTo(writer: BinaryWriter): void {
    this.header.marshalTo(writer);
    writer.writeMultiple(this.transactions);
  }

  public static unmarshalFrom(reader: BinaryReader): Block {
    return new Block(Header.unmarshalFrom(reader), reader.readMultiple(Tx));
  }

  public toBytes(): Uint8Array {
    return serialize(this);
  }

  public to_bytes(): Uint8Array {
    return this.toBytes();
  }

  public toJSON(): ReturnType<Header["toJSON"]> & { tx: ReturnType<Tx["toJSON"]>[] } {
    return {
      ...this.header.toJSON(),
      tx: this.transactions.map((transaction) => transaction.toJSON())
    };
  }

  public to_json(): ReturnType<Header["toJSON"]> & { tx: ReturnType<Tx["toJSON"]>[] } {
    return this.toJSON();
  }
}

export class TrimmedBlock {
  public constructor(
    public readonly header: Header,
    public readonly transactions: H256[]
  ) {}

  public marshalTo(writer: BinaryWriter): void {
    this.header.marshalTo(writer);
    writer.writeMultiple(this.transactions);
  }

  public static unmarshalFrom(reader: BinaryReader): TrimmedBlock {
    return new TrimmedBlock(Header.unmarshalFrom(reader), reader.readMultiple(H256));
  }

  public toBytes(): Uint8Array {
    return serialize(this);
  }

  public to_bytes(): Uint8Array {
    return this.toBytes();
  }

  public toJSON(): ReturnType<Header["toJSON"]> & { tx: string[] } {
    return {
      ...this.header.toJSON(),
      tx: this.transactions.map((transaction) => transaction.toString())
    };
  }

  public to_json(): ReturnType<Header["toJSON"]> & { tx: string[] } {
    return this.toJSON();
  }
}
