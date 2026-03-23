import { PrivateKey } from "../core/keypair.js";
export declare class ScryptParams {
    readonly n: number;
    readonly r: number;
    readonly p: number;
    constructor(n?: number, r?: number, p?: number);
    toJSON(): {
        n: number;
        r: number;
        p: number;
    };
    static fromJSON(data: {
        n: number;
        r: number;
        p: number;
    }): ScryptParams;
}
export declare function encryptSecp256r1Key(privateKey: PrivateKey, passphrase: string, addressVersion?: number, scrypt?: ScryptParams): string;
export declare function decryptSecp256r1Key(key: string, passphrase: string, addressVersion?: number, scrypt?: ScryptParams): PrivateKey;
