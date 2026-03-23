import { bytesToHex, hexToBytes } from "../internal/bytes.js";
import { Signer, Tx } from "../core/tx.js";
import { BinaryWriter, deserialize } from "../core/serializing.js";
import { WitnessScope } from "../core/witness.js";
import { reverseHex } from "../utils.js";
import { HexString } from "./hex-string.js";
import { sha256Bytes } from "./hashes.js";
import { getPrivateKeyFromWIF, isWIF } from "./wallet-helpers.js";
import { PrivateKey } from "../core/keypair.js";
import { Witness as CoreWitness } from "../core/witness.js";
function normalizeSigner(signer) {
    if (signer instanceof Signer) {
        return signer.toJSON();
    }
    if (typeof signer === "object" && signer !== null && "toJSON" in signer && typeof signer.toJSON === "function") {
        return signer.toJSON();
    }
    return signer;
}
function signerToCore(signer) {
    if (signer instanceof Signer) {
        return signer;
    }
    const json = normalizeSigner(signer);
    if ((json.rules ?? []).length > 0) {
        throw new Error("Witness rules are not yet supported in browser compatibility mode");
    }
    return new Signer({
        account: json.account,
        scopes: typeof json.scopes === "string" ? parseWitnessScope(json.scopes) : json.scopes,
        allowedContracts: json.allowedcontracts ?? [],
        allowedGroups: json.allowedgroups ?? [],
        rules: [],
    });
}
function parseWitnessScope(value) {
    if (value === "None") {
        return WitnessScope.None;
    }
    return value
        .split(",")
        .map((part) => WitnessScope[part.trim()])
        .reduce((sum, current) => (sum | current), WitnessScope.None);
}
function resolvePrivateKey(signingKey) {
    if (typeof signingKey === "object" && signingKey !== null && typeof signingKey.privateKey === "string") {
        return signingKey.privateKey;
    }
    if (typeof signingKey !== "string") {
        throw new Error("unsupported signing key");
    }
    return isWIF(signingKey) ? getPrivateKeyFromWIF(signingKey) : signingKey;
}
export class Witness {
    invocation;
    verification;
    constructor({ invocationScript, verificationScript, }) {
        this.invocation = normalizeHexLike(invocationScript);
        this.verification = normalizeHexLike(verificationScript);
    }
    get invocationScript() {
        return this.invocation;
    }
    get verificationScript() {
        return this.verification;
    }
    toJSON() {
        return {
            invocation: HexString.fromHex(this.invocation).toBase64(),
            verification: HexString.fromHex(this.verification).toBase64(),
        };
    }
    toJson() {
        return this.toJSON();
    }
    toCoreWitness() {
        return new CoreWitness(hexToBytes(this.invocation), hexToBytes(this.verification));
    }
    static fromCoreWitness(witness) {
        return new Witness({
            invocationScript: bytesToHex(witness.invocationScript),
            verificationScript: bytesToHex(witness.verificationScript),
        });
    }
}
function normalizeHexLike(value) {
    if (value instanceof HexString) {
        return value.toBigEndian();
    }
    if (value instanceof Uint8Array) {
        return bytesToHex(value);
    }
    return HexString.fromHex(value).toBigEndian();
}
export class Transaction {
    version = 0;
    nonce;
    systemFee;
    networkFee;
    validUntilBlock;
    script;
    signers;
    attributes;
    witnesses;
    constructor({ nonce = 0, systemFee = 0, networkFee = 0, validUntilBlock = 0, script = "", signers = [], witnesses = [], attributes = [], } = {}) {
        this.nonce = nonce;
        this.systemFee = BigInt(systemFee);
        this.networkFee = BigInt(networkFee);
        this.validUntilBlock = validUntilBlock;
        this.script = script instanceof HexString ? script : script instanceof Uint8Array ? HexString.fromArrayBuffer(script) : HexString.fromHex(script);
        this.signers = signers;
        this.attributes = attributes;
        this.witnesses = witnesses.map((witness) => (witness instanceof Witness ? witness : new Witness(witness)));
    }
    toCoreTx(includeWitnesses = true) {
        return new Tx({
            nonce: this.nonce,
            systemFee: this.systemFee,
            networkFee: this.networkFee,
            validUntilBlock: this.validUntilBlock,
            script: this.script.toArrayBuffer(),
            signers: this.signers.map(signerToCore),
            attributes: this.attributes,
            witnesses: includeWitnesses ? this.witnesses.map((witness) => witness.toCoreWitness()) : [],
        });
    }
    serialize(signed = true) {
        const tx = this.toCoreTx(signed);
        if (signed) {
            return bytesToHex(tx.toBytes());
        }
        const writer = new BinaryWriter();
        tx.marshalUnsignedTo(writer);
        return bytesToHex(writer.toBytes());
    }
    hash() {
        return reverseHex(bytesToHex(sha256Bytes(hexToBytes(this.serialize(false)))));
    }
    sign(signingKey, networkMagic) {
        const tx = this.toCoreTx(false);
        const witness = new PrivateKey(resolvePrivateKey(signingKey)).signWitness(tx.getSignData(networkMagic));
        const compatWitness = Witness.fromCoreWitness(witness);
        const existingIndex = this.witnesses.findIndex((item) => item.verification.toLowerCase() === compatWitness.verification.toLowerCase());
        if (existingIndex >= 0) {
            this.witnesses.splice(existingIndex, 1, compatWitness);
        }
        else {
            this.witnesses.push(compatWitness);
        }
        return this;
    }
    static deserialize(hex) {
        const tx = deserialize(hexToBytes(hex), Tx);
        return new Transaction({
            nonce: tx.nonce,
            systemFee: tx.systemFee,
            networkFee: tx.networkFee,
            validUntilBlock: tx.validUntilBlock,
            script: tx.script,
            signers: tx.signers.map((signer) => signer.toJSON()),
            attributes: tx.attributes,
            witnesses: tx.witnesses.map((witness) => Witness.fromCoreWitness(witness)),
        });
    }
}
