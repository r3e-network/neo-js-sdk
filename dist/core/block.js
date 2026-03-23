import { encodeUInt32LE } from "../internal/bytes.js";
import { sha256Bytes } from "../compat/hashes.js";
import { H160, H256 } from "./hash.js";
import { BinaryWriter, serialize } from "./serializing.js";
import { Tx } from "./tx.js";
import { Witness } from "./witness.js";
export class Header {
    version;
    previousBlockHash;
    merkleRoot;
    unixMillis;
    nonce;
    index;
    primaryIndex;
    nextConsensus;
    witness;
    constructor({ version, previousBlockHash, merkleRoot, unixMillis, nonce, index, primaryIndex, nextConsensus, witness, }) {
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
    get time() {
        return this.unixMillis;
    }
    getSignData(networkId) {
        const writer = new BinaryWriter();
        this.marshalUnsignedTo(writer);
        const digest = sha256Bytes(writer.toBytes());
        return new Uint8Array([...encodeUInt32LE(networkId), ...digest]);
    }
    marshalUnsignedTo(writer) {
        writer.writeUInt32LE(this.version);
        this.previousBlockHash.marshalTo(writer);
        this.merkleRoot.marshalTo(writer);
        writer.writeUInt64LE(this.unixMillis);
        writer.writeUInt32LE(this.nonce);
        writer.writeUInt32LE(this.index);
        writer.writeUInt8(this.primaryIndex);
        this.nextConsensus.marshalTo(writer);
    }
    marshalTo(writer) {
        this.marshalUnsignedTo(writer);
        this.witness.marshalTo(writer);
    }
    static unmarshalFrom(reader) {
        return new Header({
            version: reader.readUInt32LE(),
            previousBlockHash: H256.unmarshalFrom(reader),
            merkleRoot: H256.unmarshalFrom(reader),
            unixMillis: reader.readUInt64LE(),
            nonce: reader.readUInt32LE(),
            index: reader.readUInt32LE(),
            primaryIndex: reader.readUInt8(),
            nextConsensus: H160.unmarshalFrom(reader),
            witness: Witness.unmarshalFrom(reader),
        });
    }
    toBytes() {
        return serialize(this);
    }
    toJSON() {
        return {
            version: this.version,
            previousblockhash: this.previousBlockHash.toString(),
            merkleroot: this.merkleRoot.toString(),
            time: this.unixMillis.toString(),
            nonce: this.nonce,
            index: this.index,
            primaryindex: this.primaryIndex,
            nextconsensus: this.nextConsensus.toString(),
            witness: this.witness.toJSON(),
        };
    }
}
export class Block {
    header;
    transactions;
    constructor(header, transactions) {
        this.header = header;
        this.transactions = transactions;
    }
    marshalTo(writer) {
        this.header.marshalTo(writer);
        writer.writeMultiple(this.transactions);
    }
    static unmarshalFrom(reader) {
        return new Block(Header.unmarshalFrom(reader), reader.readMultiple(Tx));
    }
    toBytes() {
        return serialize(this);
    }
    toJSON() {
        return {
            ...this.header.toJSON(),
            tx: this.transactions.map((transaction) => transaction.toJSON()),
        };
    }
}
export class TrimmedBlock {
    header;
    transactions;
    constructor(header, transactions) {
        this.header = header;
        this.transactions = transactions;
    }
    marshalTo(writer) {
        this.header.marshalTo(writer);
        writer.writeMultiple(this.transactions);
    }
    static unmarshalFrom(reader) {
        return new TrimmedBlock(Header.unmarshalFrom(reader), reader.readMultiple(H256));
    }
    toBytes() {
        return serialize(this);
    }
    toJSON() {
        return {
            ...this.header.toJSON(),
            tx: this.transactions.map((transaction) => transaction.toString()),
        };
    }
}
