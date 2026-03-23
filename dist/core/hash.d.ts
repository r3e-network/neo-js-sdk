import { BytesLike } from "../internal/bytes.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";
declare abstract class HashBase {
    private readonly byteLength;
    protected readonly data: Uint8Array;
    protected constructor(byteLength: number, data: Uint8Array);
    toBytes(): Uint8Array;
    marshalTo(writer: BinaryWriter): void;
    toString(): string;
    equals(other: HashBase | string): boolean;
}
export declare class H160 extends HashBase {
    constructor(value?: BytesLike | string);
    static unmarshalFrom(reader: BinaryReader): H160;
}
export declare class H256 extends HashBase {
    constructor(value?: BytesLike | string);
    static unmarshalFrom(reader: BinaryReader): H256;
}
export {};
