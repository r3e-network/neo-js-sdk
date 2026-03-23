import { normalizeHex } from "./hex.js";
export function toUint8Array(value) {
    if (value instanceof Uint8Array) {
        return value.slice();
    }
    if (value instanceof ArrayBuffer) {
        return new Uint8Array(value.slice(0));
    }
    return Uint8Array.from(value);
}
export function bytesToHex(value) {
    return Buffer.from(toUint8Array(value)).toString("hex");
}
export function hexToBytes(value) {
    return Uint8Array.from(Buffer.from(normalizeHex(value), "hex"));
}
export function bytesToBase64(value) {
    return Buffer.from(toUint8Array(value)).toString("base64");
}
export function base64ToBytes(value) {
    return Uint8Array.from(Buffer.from(value, "base64"));
}
export function concatBytes(...values) {
    const arrays = values.map(toUint8Array);
    const length = arrays.reduce((sum, current) => sum + current.length, 0);
    const out = new Uint8Array(length);
    let offset = 0;
    for (const array of arrays) {
        out.set(array, offset);
        offset += array.length;
    }
    return out;
}
export function reverseBytes(value) {
    return toUint8Array(value).reverse();
}
export function equalBytes(a, b) {
    const left = toUint8Array(a);
    const right = toUint8Array(b);
    if (left.length !== right.length) {
        return false;
    }
    return left.every((byte, index) => byte === right[index]);
}
export function utf8ToBytes(value) {
    return new TextEncoder().encode(value);
}
export function encodeUInt32LE(value) {
    const out = new Uint8Array(4);
    out[0] = value & 0xff;
    out[1] = (value >> 8) & 0xff;
    out[2] = (value >> 16) & 0xff;
    out[3] = (value >> 24) & 0xff;
    return out;
}
/**
 * Convert hex string to base64 string
 * Convenience function for common conversion pattern
 */
export function hex2base64(hex) {
    return bytesToBase64(hexToBytes(hex));
}
/**
 * Convert base64 string to hex string
 * Convenience function for common conversion pattern
 */
export function base642hex(base64) {
    return bytesToHex(base64ToBytes(base64));
}
