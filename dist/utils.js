import { bytesToHex, hexToBytes, reverseBytes, utf8ToBytes } from "./internal/bytes.js";
import { hash160Bytes } from "./compat/hashes.js";
/**
 * Reverse the byte order of a hex string
 */
export function reverseHex(hex) {
    return bytesToHex(reverseBytes(hexToBytes(hex)));
}
/**
 * Convert UTF-8 string to hex string
 */
export function str2hexstring(str) {
    return bytesToHex(utf8ToBytes(str));
}
/**
 * Convert hex string to UTF-8 string
 */
export function hexstring2str(hex) {
    return Buffer.from(hexToBytes(hex)).toString("utf8");
}
/**
 * Convert number to hex string
 */
export function num2hexstring(num, size = 2, littleEndian = false) {
    let hex = num.toString(16);
    hex = hex.length % 2 ? "0" + hex : hex;
    hex = hex.padStart(size * 2, "0");
    if (littleEndian) {
        hex = reverseHex(hex);
    }
    return hex;
}
/**
 * RIPEMD160(SHA256(data))
 */
export function hash160(hex) {
    return bytesToHex(hash160Bytes(hexToBytes(hex)));
}
