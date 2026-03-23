import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { base64ToBytes, bytesToBase64 } from "../internal/bytes.js";
import { getScriptHashFromAddress } from "../compat/wallet-helpers.js";
import { H160 } from "../core/hash.js";
import { PrivateKey } from "../core/keypair.js";
import { ScryptParams, decryptSecp256r1Key, encryptSecp256r1Key } from "./nep2.js";
export class Parameter {
    name;
    type;
    constructor(name, type) {
        this.name = name;
        this.type = type;
    }
    toJSON() {
        return { name: this.name, type: this.type };
    }
    static fromJSON(data) {
        return new Parameter(data.name, data.type);
    }
}
export class Contract {
    script;
    parameters;
    deployed;
    constructor(script, parameters, deployed = false) {
        this.script = script;
        this.parameters = parameters;
        this.deployed = deployed;
    }
    toJSON() {
        return {
            script: bytesToBase64(this.script),
            parameters: this.parameters.map((parameter) => parameter.toJSON()),
            deployed: this.deployed,
        };
    }
    static fromJSON(data) {
        return new Contract(base64ToBytes(data.script), data.parameters.map((parameter) => Parameter.fromJSON(parameter)), data.deployed);
    }
}
export class Account {
    privateKey = null;
    address;
    key;
    contract;
    label;
    isDefault;
    locked;
    constructor({ address, key, contract, label = "", isDefault = false, locked = false }) {
        this.address = address;
        this.key = key;
        this.contract = contract;
        this.label = label;
        this.isDefault = isDefault;
        this.locked = locked;
    }
    setPrivateKey(privateKey) {
        this.privateKey = privateKey;
    }
    watchOnly() {
        return this.contract === null;
    }
    decrypt(passphrase, addressVersion = 53, scrypt = new ScryptParams()) {
        this.privateKey = decryptSecp256r1Key(this.key, passphrase, addressVersion, scrypt);
        return this.privateKey.publicKey();
    }
    signable() {
        return this.privateKey !== null && !this.locked && !this.watchOnly();
    }
    sign(message) {
        if (this.privateKey === null) {
            throw new Error("account is locked");
        }
        return this.privateKey.sign(message);
    }
    signWitness(signData) {
        if (this.privateKey === null) {
            throw new Error("account is locked");
        }
        return this.privateKey.signWitness(signData);
    }
    getScriptHash() {
        if (this.privateKey !== null) {
            return this.privateKey.publicKey().getScriptHash();
        }
        return new H160(`0x${getScriptHashFromAddress(this.address)}`);
    }
    toJSON() {
        if (this.contract === null) {
            throw new Error("neo: watch-only account cannot be serialized to NEP-6 by this compatibility layer");
        }
        return {
            address: this.address,
            key: this.key,
            label: this.label,
            isDefault: this.isDefault,
            lock: this.locked,
            contract: this.contract.toJSON(),
        };
    }
    static fromJSON(data) {
        if (data.contract === null || data.contract === undefined) {
            throw new Error("contract is required in NEP-6 JSON");
        }
        return new Account({
            address: data.address,
            key: data.key,
            label: data.label,
            isDefault: data.isDefault,
            locked: data.lock,
            contract: Contract.fromJSON(data.contract),
        });
    }
}
export class Wallet {
    name;
    version;
    scrypt;
    accounts;
    passphrase;
    constructor({ name, accounts = [], scrypt = new ScryptParams(), passphrase, version = "1.0" }) {
        this.name = name;
        this.accounts = accounts;
        this.scrypt = scrypt;
        this.version = version;
        this.passphrase = passphrase;
    }
    createAccount() {
        if (!this.passphrase) {
            throw new Error("passphrase is not set");
        }
        const privateKey = new PrivateKey();
        const publicKey = privateKey.publicKey();
        const address = publicKey.getAddress();
        const contract = new Contract(publicKey.getSignatureRedeemScript(), [new Parameter("signature", "Signature")]);
        const key = encryptSecp256r1Key(privateKey, this.passphrase, 53, this.scrypt);
        const account = new Account({
            address,
            key,
            contract,
        });
        account.setPrivateKey(privateKey);
        this.accounts.push(account);
        return account;
    }
    decrypt(passphrase) {
        this.passphrase = passphrase;
        for (const account of this.accounts) {
            account.decrypt(passphrase, 53, this.scrypt);
        }
    }
    writeToFile(path) {
        if (existsSync(path)) {
            throw new Error(`wallet file ${path} already exists`);
        }
        writeFileSync(path, JSON.stringify(this.toJSON()), "utf8");
    }
    toJSON() {
        return {
            name: this.name,
            version: this.version,
            scrypt: this.scrypt.toJSON(),
            accounts: this.accounts.map((account) => account.toJSON()),
        };
    }
    static fromJSON(data) {
        return new Wallet({
            name: data.name,
            version: data.version,
            scrypt: ScryptParams.fromJSON(data.scrypt),
            accounts: data.accounts.map((account) => Account.fromJSON(account)),
        });
    }
    static openNep6Wallet(path) {
        const raw = readFileSync(path, "utf8");
        return Wallet.fromJSON(JSON.parse(raw));
    }
}
