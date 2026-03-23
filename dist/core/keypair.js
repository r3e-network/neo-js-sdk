import { bytesToHex, equalBytes, hexToBytes, toUint8Array } from "../internal/bytes.js";
import { getAddressFromScriptHash, getScriptHashFromPublicKey, getVerificationScriptFromPublicKey, publicKeyFromPrivateKey, randomPrivateKeyHex, signBytes, verifyBytes, } from "../compat/wallet-helpers.js";
import { H160 } from "./hash.js";
import { ScriptBuilder } from "./script.js";
import { Witness } from "./witness.js";
function privateKeyToHex(value) {
    if (typeof value === "string") {
        const bytes = hexToBytes(value);
        if (bytes.length !== 32) {
            throw new Error("invalid secp256r1 private key");
        }
        return bytesToHex(bytes);
    }
    if (typeof value === "bigint" || typeof value === "number") {
        let remaining = BigInt(value);
        const bytes = new Uint8Array(32);
        for (let index = 31; index >= 0; index -= 1) {
            bytes[index] = Number(remaining & 0xffn);
            remaining >>= 8n;
        }
        return bytesToHex(bytes);
    }
    if (value instanceof Uint8Array) {
        if (value.length !== 32) {
            throw new Error("invalid secp256r1 private key");
        }
        return bytesToHex(value);
    }
    return randomPrivateKeyHex();
}
export class PrivateKey {
    hex;
    constructor(value) {
        this.hex = privateKeyToHex(value);
    }
    publicKey() {
        return new PublicKey(publicKeyFromPrivateKey(this.hex));
    }
    sign(message) {
        return signBytes(message, this.hex);
    }
    signWitness(signData) {
        const signature = this.sign(signData);
        const invocation = new ScriptBuilder().emitPush(signature).toBytes();
        const verification = this.publicKey().getSignatureRedeemScript();
        return new Witness(invocation, verification);
    }
    toBytes() {
        return hexToBytes(this.hex);
    }
}
export class PublicKey {
    hex;
    constructor(value) {
        const bytes = typeof value === "string" ? hexToBytes(value) : toUint8Array(value);
        if (![33, 65].includes(bytes.length)) {
            throw new Error("unsupported public key");
        }
        this.hex = bytesToHex(bytes);
    }
    getScriptHash() {
        return new H160(`0x${getScriptHashFromPublicKey(this.hex)}`);
    }
    getAddress(addressVersion = 53) {
        return getAddressFromScriptHash(getScriptHashFromPublicKey(this.hex), addressVersion);
    }
    getSignatureRedeemScript() {
        return hexToBytes(getVerificationScriptFromPublicKey(this.hex));
    }
    verify(message, signature) {
        return verifyBytes(message, signature, this.hex);
    }
    toBytes() {
        return hexToBytes(this.hex);
    }
    marshalTo(writer) {
        writer.write(this.toBytes());
    }
    static unmarshalFrom(reader) {
        const prefix = reader.readUInt8();
        if (prefix === 0x02 || prefix === 0x03) {
            return new PublicKey(Uint8Array.of(prefix, ...reader.read(32)));
        }
        if (prefix === 0x04) {
            return new PublicKey(Uint8Array.of(prefix, ...reader.read(64)));
        }
        throw new Error(`unexpected PublicKey prefix: ${prefix}`);
    }
    toString() {
        return this.hex;
    }
    equals(other) {
        const comparable = typeof other === "string" ? new PublicKey(other) : other;
        return equalBytes(this.toBytes(), comparable.toBytes());
    }
}
