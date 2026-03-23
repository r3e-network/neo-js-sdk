import { BinaryReader, BinaryWriter } from "./serializing.js";
export declare enum WitnessScope {
    None = 0,
    CalledByEntry = 1,
    CustomContracts = 16,
    CustomGroups = 32,
    WitnessRules = 64,
    Global = 128
}
export declare function witnessScopeName(scope: WitnessScope): string;
export declare class Witness {
    invocation: Uint8Array;
    verification: Uint8Array;
    constructor(invocation: Uint8Array, verification: Uint8Array);
    get invocationScript(): Uint8Array;
    get verificationScript(): Uint8Array;
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): Witness;
    toJSON(): {
        invocation: string;
        verification: string;
    };
    equals(other: Witness): boolean;
}
