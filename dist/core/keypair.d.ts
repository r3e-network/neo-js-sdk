import { H160 } from "./hash.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";
import { Witness } from "./witness.js";
export declare class PrivateKey {
    private readonly hex;
    constructor(value?: Uint8Array | string | bigint | number);
    publicKey(): PublicKey;
    sign(message: Uint8Array): Uint8Array;
    signWitness(signData: Uint8Array): Witness;
    toBytes(): Uint8Array;
}
export declare class PublicKey {
    private readonly hex;
    constructor(value: Uint8Array | string);
    getScriptHash(): H160;
    getAddress(addressVersion?: number): string;
    getSignatureRedeemScript(): Uint8Array;
    verify(message: Uint8Array, signature: Uint8Array): boolean;
    toBytes(): Uint8Array;
    marshalTo(writer: BinaryWriter): void;
    static unmarshalFrom(reader: BinaryReader): PublicKey;
    toString(): string;
    equals(other: PublicKey | string): boolean;
}
