import { BytesLike } from "../internal/bytes.js";
type Marshaled = {
    marshalTo(writer: BinaryWriter): void;
};
type Unmarshalable<T> = {
    unmarshalFrom(reader: BinaryReader): T;
};
export declare class BinaryWriter {
    private readonly chunks;
    write(data: BytesLike): void;
    writeVarBytes(data: BytesLike): void;
    writeVarString(value: string): void;
    writeBool(value: boolean): void;
    writeUInt8(value: number): void;
    writeUInt16LE(value: number): void;
    writeUInt32LE(value: number): void;
    writeUInt64LE(value: bigint | number): void;
    writeVarInt(value: bigint | number): void;
    writeMultiple(items: Marshaled[]): void;
    toBytes(): Uint8Array;
}
export declare class BinaryReader {
    private readonly data;
    private index;
    constructor(data: Uint8Array);
    remaining(): number;
    read(length: number): Uint8Array;
    readVarInt(): bigint;
    readVarBytes(): Uint8Array;
    readVarString(): string;
    readBool(): boolean;
    readUInt8(): number;
    readUInt16LE(): number;
    readUInt32LE(): number;
    readUInt64LE(): bigint;
    readMultiple<T>(type: Unmarshalable<T>): T[];
}
export declare function serialize(value: Marshaled): Uint8Array;
export declare function deserialize<T>(data: BytesLike, type: Unmarshalable<T>): T;
export {};
