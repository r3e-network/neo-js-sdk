import { base64ToBytes, bytesToBase64, bytesToHex, hexToBytes } from "../internal/bytes.js";
import { HexString } from "../compat/hex-string.js";
import { DEFAULT_ADDRESS_VERSION, constructMultiSigVerificationScript, getAddressFromScriptHash, getAddressVersion, getPrivateKeyFromWIF, getScriptHashFromAddress, getScriptHashFromVerificationScript, getVerificationScriptFromPublicKey, getWIFFromPrivateKey, isAddress, isPrivateKey, isPublicKey, isScriptHash, isWIF, normalizePublicKey, publicKeyFromPrivateKey, randomPrivateKeyHex, signHex, } from "../compat/wallet-helpers.js";
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
function verificationScriptBase64(publicKey) {
    return bytesToBase64(hexToBytes(getVerificationScriptFromPublicKey(publicKey)));
}
export class Account {
    addressVersion;
    label;
    isDefault;
    lock;
    contract;
    privateKeyValue;
    publicKeyValue;
    scriptHashValue;
    addressValue;
    constructor(value = "", config = {}) {
        const detectedAddressVersion = typeof value === "string" && isAddress(value)
            ? getAddressVersion(value)
            : typeof value === "object" && value.address && isAddress(value.address)
                ? getAddressVersion(value.address)
                : undefined;
        this.addressVersion = config.addressVersion ?? detectedAddressVersion ?? DEFAULT_ADDRESS_VERSION;
        this.label = typeof value === "object" ? value.label ?? "" : "";
        this.isDefault = typeof value === "object" ? value.isDefault ?? false : false;
        this.lock = typeof value === "object" ? value.lock ?? false : false;
        this.contract =
            typeof value === "object" && value.contract
                ? {
                    script: value.contract.script,
                    parameters: [...value.contract.parameters],
                    deployed: value.contract.deployed,
                }
                : { script: "", parameters: [], deployed: false };
        if (typeof value === "object") {
            this.addressValue = value.address;
            return;
        }
        if (!value) {
            const privateKey = randomPrivateKeyHex();
            this.privateKeyValue = privateKey;
            this.publicKeyValue = publicKeyFromPrivateKey(privateKey, true);
            this.contract = {
                script: verificationScriptBase64(this.publicKeyValue),
                parameters: [{ name: "signature", type: "Signature" }],
                deployed: false,
            };
            return;
        }
        if (isPrivateKey(value)) {
            this.privateKeyValue = value;
            this.publicKeyValue = publicKeyFromPrivateKey(value, true);
            this.contract = {
                script: verificationScriptBase64(this.publicKeyValue),
                parameters: [{ name: "signature", type: "Signature" }],
                deployed: false,
            };
            return;
        }
        if (isWIF(value)) {
            const privateKey = getPrivateKeyFromWIF(value);
            this.privateKeyValue = privateKey;
            this.publicKeyValue = publicKeyFromPrivateKey(privateKey, true);
            this.contract = {
                script: verificationScriptBase64(this.publicKeyValue),
                parameters: [{ name: "signature", type: "Signature" }],
                deployed: false,
            };
            return;
        }
        if (isPublicKey(value)) {
            this.publicKeyValue = normalizePublicKey(value, true);
            this.contract = {
                script: verificationScriptBase64(this.publicKeyValue),
                parameters: [{ name: "signature", type: "Signature" }],
                deployed: false,
            };
            return;
        }
        if (isScriptHash(value)) {
            this.scriptHashValue = HexString.fromHex(value).toBigEndian();
            return;
        }
        if (isAddress(value)) {
            this.addressValue = value;
            return;
        }
        throw new ReferenceError(`Invalid input: ${value}`);
    }
    static fromWIF(wif) {
        return new Account(wif);
    }
    static createMultiSig(signingThreshold, publicKeys) {
        const verificationScript = constructMultiSigVerificationScript(signingThreshold, publicKeys);
        return new Account({
            contract: {
                script: bytesToBase64(hexToBytes(verificationScript)),
                parameters: Array.from({ length: signingThreshold }, (_, index) => ({
                    name: `signature${index}`,
                    type: "Signature",
                })),
                deployed: false,
            },
        });
    }
    get privateKey() {
        if (!this.privateKeyValue) {
            throw new Error("No Private Key provided");
        }
        return this.privateKeyValue;
    }
    get publicKey() {
        if (this.publicKeyValue) {
            return HexString.fromHex(this.publicKeyValue);
        }
        if (this.privateKeyValue) {
            return HexString.fromHex(publicKeyFromPrivateKey(this.privateKeyValue, true));
        }
        throw new Error("No Public Key provided");
    }
    get WIF() {
        return getWIFFromPrivateKey(this.privateKey);
    }
    get scriptHash() {
        if (this.scriptHashValue) {
            return this.scriptHashValue;
        }
        if (this.addressValue) {
            return getScriptHashFromAddress(this.addressValue);
        }
        if (this.contract.script) {
            return getScriptHashFromVerificationScript(bytesToHex(base64ToBytes(this.contract.script)));
        }
        return getScriptHashFromAddress(this.address);
    }
    get address() {
        if (this.addressValue) {
            return this.addressValue;
        }
        return getAddressFromScriptHash(this.scriptHash, this.addressVersion);
    }
    sign(messageHex) {
        return signHex(messageHex, this.privateKey);
    }
}
export class Wallet {
    static isAddress = isAddress;
    constructor() {
        throw new Error("browser Wallet compatibility class only exposes static helpers");
    }
}
