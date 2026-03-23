import { H160, H256 } from "./hash.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";
import { Tx } from "./tx.js";
import { Witness } from "./witness.js";
export declare class Header {
    readonly version: number;
    readonly previousBlockHash: H256;
    readonly merkleRoot: H256;
    readonly unixMillis: bigint;
    readonly nonce: number;
    readonly index: number;
    readonly primaryIndex: number;
    readonly nextConsensus: H160;
    readonly witness: Witness;
    constructor({ version, previousBlockHash, merkleRoot, unixMillis, nonce, index, primaryIndex, nextConsensus, witness, }: {
        version: number;
        previousBlockHash: H256;
        merkleRoot: H256;
        unixMillis: bigint | number;
        nonce: number;
        index: number;
        primaryIndex: number;
        nextConsensus: H160;
        witness: Witness;
    });
    get time(): bigint;
    getSignData(networkId: number): Uint8Array;
    marshalUnsignedTo(writer: BinaryWriter): void;
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): Header;
    toBytes(): Uint8Array;
    toJSON(): {
        version: number;
        previousblockhash: string;
        merkleroot: string;
        time: string;
        nonce: number;
        index: number;
        primaryindex: number;
        nextconsensus: string;
        witness: ReturnType<Witness["toJSON"]>;
    };
}
export declare class Block {
    readonly header: Header;
    readonly transactions: Tx[];
    constructor(header: Header, transactions: Tx[]);
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): Block;
    toBytes(): Uint8Array;
    toJSON(): ReturnType<Header["toJSON"]> & {
        tx: ReturnType<Tx["toJSON"]>[];
    };
}
export declare class TrimmedBlock {
    readonly header: Header;
    readonly transactions: H256[];
    constructor(header: Header, transactions: H256[]);
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): TrimmedBlock;
    toBytes(): Uint8Array;
    toJSON(): ReturnType<Header["toJSON"]> & {
        tx: string[];
    };
}
