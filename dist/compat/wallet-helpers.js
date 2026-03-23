import { p256 } from "@noble/curves/p256";
import bs58 from "bs58";
import { bytesToBase64, bytesToHex, concatBytes, encodeUInt32LE, hexToBytes, reverseBytes } from "../internal/bytes.js";
import { normalizeHex, strip0x } from "../internal/hex.js";
import { OpCode } from "../core/opcode.js";
import { hash160Bytes, hash160Hex, hash256Bytes, sha256Bytes } from "./hashes.js";
export const DEFAULT_ADDRESS_VERSION = 53;
function getChecksum(payload) {
    return hash256Bytes(payload).slice(0, 4);
}
function base58CheckEncode(payload) {
    return bs58.encode(concatBytes(payload, getChecksum(payload)));
}
function base58CheckDecode(value) {
    const decoded = Uint8Array.from(bs58.decode(value));
    if (decoded.length < 5) {
        throw new Error("invalid base58check payload");
    }
    const payload = decoded.slice(0, -4);
    const checksum = decoded.slice(-4);
    const expected = getChecksum(payload);
    if (bytesToHex(checksum) !== bytesToHex(expected)) {
        throw new Error("invalid base58check checksum");
    }
    return payload;
}
function normalizeScriptHash(value) {
    const normalized = normalizeHex(value);
    if (normalized.length !== 40) {
        throw new Error("invalid script hash");
    }
    return normalized;
}
function normalizePrivateKey(value) {
    const normalized = normalizeHex(value);
    const bytes = hexToBytes(normalized);
    if (bytes.length !== 32 || !p256.utils.isValidPrivateKey(bytes)) {
        throw new Error("invalid secp256r1 private key");
    }
    return normalized;
}
function syscallCode(syscallName) {
    const hash = sha256Bytes(new TextEncoder().encode(syscallName));
    return hash[0] | (hash[1] << 8) | (hash[2] << 16) | (hash[3] << 24);
}
function bigintToFixedLE(value) {
    if (value >= -1n && value <= 16n) {
        return new Uint8Array();
    }
    const widths = [8, 16, 32, 64, 128, 256];
    for (const bits of widths) {
        const min = -(1n << BigInt(bits - 1));
        const max = (1n << BigInt(bits - 1)) - 1n;
        if (value < min || value > max) {
            continue;
        }
        const mod = 1n << BigInt(bits);
        let unsigned = value < 0n ? mod + value : value;
        const bytes = new Uint8Array(bits / 8);
        for (let index = 0; index < bytes.length; index += 1) {
            bytes[index] = Number(unsigned & 0xffn);
            unsigned >>= 8n;
        }
        return bytes;
    }
    throw new Error(`push too large integer: ${value.toString()}`);
}
function emit(opcode, operand = new Uint8Array()) {
    return concatBytes(Uint8Array.of(opcode), operand);
}
function emitPushInt(value) {
    if (value >= -1n && value <= 16n) {
        return emit((OpCode.PUSHM1 + Number(value) + 1));
    }
    const payload = bigintToFixedLE(value);
    switch (payload.length) {
        case 1:
            return emit(OpCode.PUSHINT8, payload);
        case 2:
            return emit(OpCode.PUSHINT16, payload);
        case 4:
            return emit(OpCode.PUSHINT32, payload);
        case 8:
            return emit(OpCode.PUSHINT64, payload);
        case 16:
            return emit(OpCode.PUSHINT128, payload);
        case 32:
            return emit(OpCode.PUSHINT256, payload);
        default:
            throw new Error(`unsupported integer width: ${payload.length}`);
    }
}
function emitPushBytes(value) {
    if (value.length < 0x100) {
        return emit(OpCode.PUSHDATA1, concatBytes(Uint8Array.of(value.length), value));
    }
    if (value.length < 0x10000) {
        return emit(OpCode.PUSHDATA2, concatBytes(Uint8Array.of(value.length & 0xff, (value.length >> 8) & 0xff), value));
    }
    if (value.length < 0x100000000) {
        return emit(OpCode.PUSHDATA4, concatBytes(Uint8Array.of(value.length & 0xff, (value.length >> 8) & 0xff, (value.length >> 16) & 0xff, (value.length >> 24) & 0xff), value));
    }
    throw new Error("push too large bytes");
}
function emitSyscall(syscallName) {
    return emit(OpCode.SYSCALL, encodeUInt32LE(syscallCode(syscallName)));
}
export function randomPrivateKeyHex() {
    return bytesToHex(p256.utils.randomPrivateKey());
}
export function isPrivateKey(value) {
    try {
        normalizePrivateKey(value);
        return true;
    }
    catch {
        return false;
    }
}
export function normalizePublicKey(value, compressed = true) {
    const normalized = normalizeHex(value);
    const point = p256.ProjectivePoint.fromHex(normalized);
    return bytesToHex(point.toRawBytes(compressed));
}
export function isPublicKey(value) {
    try {
        normalizePublicKey(value, false);
        return true;
    }
    catch {
        return false;
    }
}
export function isScriptHash(value) {
    try {
        normalizeScriptHash(value);
        return true;
    }
    catch {
        return false;
    }
}
export function isAddress(value) {
    try {
        const payload = base58CheckDecode(value);
        return payload.length === 21;
    }
    catch {
        return false;
    }
}
export function getAddressVersion(address) {
    const payload = base58CheckDecode(address);
    if (payload.length !== 21) {
        throw new Error("invalid address payload");
    }
    return payload[0];
}
export function getPrivateKeyFromWIF(wif) {
    const payload = base58CheckDecode(wif);
    if (payload.length !== 34 || payload[0] !== 0x80 || payload[33] !== 0x01) {
        throw new Error("invalid WIF");
    }
    return normalizePrivateKey(bytesToHex(payload.slice(1, 33)));
}
export function getWIFFromPrivateKey(privateKey) {
    const normalized = normalizePrivateKey(privateKey);
    return base58CheckEncode(concatBytes(Uint8Array.of(0x80), hexToBytes(normalized), Uint8Array.of(0x01)));
}
export function isWIF(value) {
    try {
        getPrivateKeyFromWIF(value);
        return true;
    }
    catch {
        return false;
    }
}
export function publicKeyFromPrivateKey(privateKey, compressed = true) {
    const normalized = normalizePrivateKey(privateKey);
    return bytesToHex(p256.getPublicKey(hexToBytes(normalized), compressed));
}
export function signHex(hex, privateKey) {
    const normalized = normalizeHex(hex);
    const digest = sha256Bytes(hexToBytes(normalized));
    return p256.sign(digest, hexToBytes(normalizePrivateKey(privateKey))).toCompactHex();
}
export function signBytes(message, privateKey) {
    const digest = sha256Bytes(message);
    return Uint8Array.from(p256.sign(digest, hexToBytes(normalizePrivateKey(privateKey))).toCompactRawBytes());
}
export function verifyHex(hex, signature, publicKey) {
    const normalizedHex = normalizeHex(hex);
    const normalizedSignature = normalizeHex(signature);
    const digest = sha256Bytes(hexToBytes(normalizedHex));
    return p256.verify(normalizedSignature, digest, normalizePublicKey(publicKey, false));
}
export function verifyBytes(message, signature, publicKey) {
    const digest = sha256Bytes(message);
    return p256.verify(signature, digest, normalizePublicKey(publicKey, false));
}
export function getVerificationScriptFromPublicKey(publicKey) {
    const encoded = hexToBytes(normalizePublicKey(publicKey, true));
    return bytesToHex(concatBytes(emitPushBytes(encoded), emitSyscall("System.Crypto.CheckSig")));
}
export function getScriptHashFromVerificationScript(verificationScript) {
    return bytesToHex(reverseBytes(hash160Bytes(hexToBytes(normalizeHex(verificationScript)))));
}
export function getScriptHashFromPublicKey(publicKey) {
    return getScriptHashFromVerificationScript(getVerificationScriptFromPublicKey(publicKey));
}
export function getAddressFromScriptHash(scriptHash, addressVersion = DEFAULT_ADDRESS_VERSION) {
    const normalized = normalizeScriptHash(scriptHash);
    const payload = concatBytes(Uint8Array.of(addressVersion), reverseBytes(hexToBytes(normalized)));
    return base58CheckEncode(payload);
}
export function getScriptHashFromAddress(address) {
    const payload = base58CheckDecode(address);
    if (payload.length !== 21) {
        throw new Error("invalid address payload");
    }
    return bytesToHex(reverseBytes(payload.slice(1)));
}
export function constructMultiSigVerificationScript(signingThreshold, publicKeys) {
    if (!Number.isInteger(signingThreshold) || signingThreshold <= 0) {
        throw new Error("signingThreshold must be bigger than zero");
    }
    if (signingThreshold > publicKeys.length) {
        throw new Error("signingThreshold must be smaller than or equal to number of keys");
    }
    const chunks = [emitPushInt(BigInt(signingThreshold))];
    for (const publicKey of publicKeys) {
        chunks.push(emitPushBytes(hexToBytes(normalizePublicKey(publicKey, true))));
    }
    chunks.push(emitPushInt(BigInt(publicKeys.length)));
    chunks.push(emitSyscall("System.Crypto.CheckMultisig"));
    return bytesToHex(concatBytes(...chunks));
}
export function scriptHashToAddressLabel(scriptHash) {
    const normalized = normalizeScriptHash(scriptHash);
    return {
        scriptHash: normalized,
        address: getAddressFromScriptHash(normalized),
    };
}
export function addressToScriptHashLabel(address) {
    const scriptHash = getScriptHashFromAddress(address);
    return { address, scriptHash };
}
export function verificationScriptToBase64(publicKey) {
    return bytesToBase64(hexToBytes(getVerificationScriptFromPublicKey(publicKey)));
}
export function isSupportedAccountInput(value) {
    return isPrivateKey(value) || isPublicKey(value) || isScriptHash(value) || isAddress(value) || isWIF(value);
}
export function normalizeAccountInput(value) {
    return strip0x(String(value).trim());
}
export function hash160Script(scriptHex) {
    return hash160Hex(normalizeHex(scriptHex));
}
