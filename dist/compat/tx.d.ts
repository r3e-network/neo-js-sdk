import { type SignerJson, Signer, Tx } from "../core/tx.js";
import { HexString } from "./hex-string.js";
import { Witness as CoreWitness } from "../core/witness.js";
type SignerLike = Signer | SignerJson | Record<string, unknown>;
export declare class Witness {
    readonly invocation: string;
    readonly verification: string;
    constructor({ invocationScript, verificationScript, }: {
        invocationScript: string | HexString | Uint8Array;
        verificationScript: string | HexString | Uint8Array;
    });
    get invocationScript(): string;
    get verificationScript(): string;
    toJSON(): {
        invocation: string;
        verification: string;
    };
    toJson(): {
        invocation: string;
        verification: string;
    };
    toCoreWitness(): CoreWitness;
    static fromCoreWitness(witness: CoreWitness): Witness;
}
export declare class Transaction {
    readonly version = 0;
    nonce: number;
    systemFee: bigint;
    networkFee: bigint;
    validUntilBlock: number;
    script: HexString;
    signers: SignerLike[];
    attributes: Tx["attributes"];
    witnesses: Witness[];
    constructor({ nonce, systemFee, networkFee, validUntilBlock, script, signers, witnesses, attributes, }?: {
        nonce?: number;
        systemFee?: bigint | number | string;
        networkFee?: bigint | number | string;
        validUntilBlock?: number;
        script?: string | HexString | Uint8Array;
        signers?: SignerLike[];
        witnesses?: Array<Witness | {
            invocationScript: string | HexString | Uint8Array;
            verificationScript: string | HexString | Uint8Array;
        }>;
        attributes?: Tx["attributes"];
    });
    private toCoreTx;
    serialize(signed?: boolean): string;
    hash(): string;
    sign(signingKey: string | {
        privateKey: string;
    }, networkMagic: number): this;
    static deserialize(hex: string): Transaction;
}
export {};
