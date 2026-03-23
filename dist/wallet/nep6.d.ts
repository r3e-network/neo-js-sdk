import { H160 } from "../core/hash.js";
import { PrivateKey, PublicKey } from "../core/keypair.js";
import { Witness } from "../core/witness.js";
import { ScryptParams } from "./nep2.js";
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
export interface AccountOptions {
    address: string;
    key: string;
    contract: Contract | null;
    label?: string;
    isDefault?: boolean;
    locked?: boolean;
}
export declare class Account {
    private privateKey;
    readonly address: string;
    readonly key: string;
    readonly contract: Contract | null;
    readonly label: string;
    readonly isDefault: boolean;
    readonly locked: boolean;
    constructor({ address, key, contract, label, isDefault, locked }: AccountOptions);
    setPrivateKey(privateKey: PrivateKey): void;
    watchOnly(): boolean;
    decrypt(passphrase: string, addressVersion?: number, scrypt?: ScryptParams): PublicKey;
    signable(): boolean;
    sign(message: Uint8Array): Uint8Array;
    signWitness(signData: Uint8Array): Witness;
    getScriptHash(): H160;
    toJSON(): {
        address: string;
        key: string;
        label: string;
        isDefault: boolean;
        lock: boolean;
        contract: ReturnType<Contract["toJSON"]> | null;
    };
    static fromJSON(data: {
        address: string;
        key: string;
        label: string;
        isDefault: boolean;
        lock: boolean;
        contract: {
            script: string;
            parameters: Array<{
                name: string;
                type: string;
            }>;
            deployed: boolean;
        } | null;
    }): Account;
}
export interface WalletOptions {
    name: string;
    accounts?: Account[];
    scrypt?: ScryptParams;
    passphrase?: string;
    version?: string;
}
export declare class Wallet {
    readonly name: string;
    readonly version: string;
    readonly scrypt: ScryptParams;
    readonly accounts: Account[];
    private passphrase?;
    constructor({ name, accounts, scrypt, passphrase, version }: WalletOptions);
    createAccount(): Account;
    decrypt(passphrase: string): void;
    writeToFile(path: string): void;
    toJSON(): {
        name: string;
        version: string;
        scrypt: ReturnType<ScryptParams["toJSON"]>;
        accounts: ReturnType<Account["toJSON"]>[];
    };
    static fromJSON(data: {
        name: string;
        version: string;
        scrypt: {
            n: number;
            r: number;
            p: number;
        };
        accounts: Array<{
            address: string;
            key: string;
            label: string;
            isDefault: boolean;
            lock: boolean;
            contract: {
                script: string;
                parameters: Array<{
                    name: string;
                    type: string;
                }>;
                deployed: boolean;
            } | null;
        }>;
    }): Wallet;
    static openNep6Wallet(path: string): Wallet;
}
