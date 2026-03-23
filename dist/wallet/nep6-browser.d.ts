import { HexString } from "../compat/hex-string.js";
import { isAddress } from "../compat/wallet-helpers.js";
export declare class Parameter {
    readonly name: string;
    readonly type: string;
    constructor(name: string, type: string);
    toJSON(): {
        name: string;
        type: string;
    };
    static fromJSON(data: {
        name: string;
        type: string;
    }): Parameter;
}
export declare class Contract {
    readonly script: Uint8Array;
    readonly parameters: Parameter[];
    readonly deployed: boolean;
    constructor(script: Uint8Array, parameters: Parameter[], deployed?: boolean);
    toJSON(): {
        script: string;
        parameters: Array<{
            name: string;
            type: string;
        }>;
        deployed: boolean;
    };
    static fromJSON(data: {
        script: string;
        parameters: Array<{
            name: string;
            type: string;
        }>;
        deployed: boolean;
    }): Contract;
}
export declare class Account {
    readonly addressVersion: number;
    readonly label: string;
    readonly isDefault: boolean;
    readonly lock: boolean;
    readonly contract: {
        script: string;
        parameters: Array<{
            name: string;
            type: string;
        }>;
        deployed: boolean;
    };
    private readonly privateKeyValue?;
    private readonly publicKeyValue?;
    private readonly scriptHashValue?;
    private readonly addressValue?;
    constructor(value?: string | {
        address?: string;
        label?: string;
        isDefault?: boolean;
        lock?: boolean;
        contract?: {
            script: string;
            parameters: Array<{
                name: string;
                type: string;
            }>;
            deployed: boolean;
        };
    }, config?: {
        addressVersion?: number;
    });
    static fromWIF(wif: string): Account;
    static createMultiSig(signingThreshold: number, publicKeys: string[]): Account;
    get privateKey(): string;
    get publicKey(): HexString;
    get WIF(): string;
    get scriptHash(): string;
    get address(): string;
    sign(messageHex: string): string;
}
export declare class Wallet {
    static readonly isAddress: typeof isAddress;
    constructor();
}
