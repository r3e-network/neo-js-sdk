export declare class HexString {
    private readonly value;
    constructor(value: string, littleEndian?: boolean);
    get length(): number;
    get byteLength(): number;
    toString(): string;
    toHex(): string;
    toJSON(): string;
    toBigEndian(): string;
    toLittleEndian(): string;
    reversed(): HexString;
    equals(other: HexString | string): boolean;
    toNumber(asLittleEndian?: boolean): number;
    toArrayBuffer(asLittleEndian?: boolean): Uint8Array;
    toBase64(asLittleEndian?: boolean): string;
    static fromHex(value: HexString | string, littleEndian?: boolean): HexString;
    static fromArrayBuffer(value: Uint8Array, littleEndian?: boolean): HexString;
    static fromBase64(value: string, littleEndian?: boolean): HexString;
    static fromAscii(value: string): HexString;
    static fromNumber(value: number): HexString;
}
