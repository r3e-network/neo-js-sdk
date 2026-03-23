import { ripemd160 } from "@noble/hashes/ripemd160";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes, toUint8Array } from "../internal/bytes.js";
export function sha256Bytes(value) {
    return Uint8Array.from(sha256(toUint8Array(value)));
}
export function hash256Bytes(value) {
    return sha256Bytes(sha256Bytes(value));
}
export function hash160Bytes(value) {
    return Uint8Array.from(ripemd160(sha256Bytes(value)));
}
export function sha256Hex(value) {
    return bytesToHex(sha256Bytes(hexToBytes(value)));
}
export function hash256Hex(value) {
    return bytesToHex(hash256Bytes(hexToBytes(value)));
}
export function hash160Hex(value) {
    return bytesToHex(hash160Bytes(hexToBytes(value)));
}
