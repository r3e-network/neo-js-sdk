import { HexString } from "./hex-string.js";
export declare enum ContractParamType {
    Any = 0,
    Boolean = 16,
    Integer = 17,
    ByteArray = 18,
    String = 19,
    Hash160 = 20,
    Hash256 = 21,
    PublicKey = 22,
    Signature = 23,
    Array = 32,
    Map = 34,
    InteropInterface = 48,
    Void = 255
}
type ContractParamMapEntry = {
    key: ContractParam | ContractParamJson;
    value: ContractParam | ContractParamJson;
};
export type ContractParamJson = {
    type: keyof typeof ContractParamType | ContractParamType;
    value?: unknown;
};
export declare class ContractParam {
    readonly type: ContractParamType;
    readonly value: null | boolean | string | HexString | ContractParam[] | Array<{
        key: ContractParam;
        value: ContractParam;
    }>;
    constructor(input: ContractParam | ContractParamJson);
    toJSON(): Record<string, unknown>;
    toJson(): Record<string, unknown>;
    static any(value?: string | HexString | null): ContractParam;
    static boolean(value: boolean | number | string): ContractParam;
    static integer(value: bigint | number | string): ContractParam;
    static string(value: string): ContractParam;
    static byteArray(value: string | HexString): ContractParam;
    static hash160(value: string | HexString): ContractParam;
    static hash256(value: string | HexString): ContractParam;
    static publicKey(value: string | HexString): ContractParam;
    static signature(value: string | HexString): ContractParam;
    static array(...params: Array<ContractParam | ContractParamJson>): ContractParam;
    static map(...params: ContractParamMapEntry[]): ContractParam;
    static void(): ContractParam;
    static fromJson(input: ContractParam | ContractParamJson): ContractParam;
}
export {};
