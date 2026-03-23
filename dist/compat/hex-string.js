import { bytesToHex, hexToBytes } from "../internal/bytes.js";
import { normalizeHex } from "../internal/hex.js";
function bytesToBase64(value) {
    return Buffer.from(value).toString("base64");
}
function base64ToBytes(value) {
    return Uint8Array.from(Buffer.from(value, "base64"));
}
function reverseHex(value) {
    return bytesToHex(hexToBytes(value).reverse());
}
export class HexString {
    value;
    constructor(value, littleEndian = false) {
        const normalized = normalizeHex(value);
        this.value = littleEndian ? reverseHex(normalized) : normalized;
    }
    get length() {
        return this.value.length;
    }
    get byteLength() {
        return this.value.length / 2;
    }
    toString() {
        return this.value;
    }
    toHex() {
        return this.value;
    }
    toJSON() {
        return this.value;
    }
    toBigEndian() {
        return this.value;
    }
    toLittleEndian() {
        return reverseHex(this.value);
    }
    reversed() {
        return new HexString(this.toLittleEndian());
    }
    equals(other) {
        return this.value === HexString.fromHex(typeof other === "string" ? other : other.toBigEndian()).toBigEndian();
    }
    toNumber(asLittleEndian = false) {
        return parseInt(asLittleEndian ? this.toLittleEndian() : this.toBigEndian(), 16);
    }
    toArrayBuffer(asLittleEndian = false) {
        return hexToBytes(asLittleEndian ? this.toLittleEndian() : this.toBigEndian());
    }
    toBase64(asLittleEndian = false) {
        return bytesToBase64(this.toArrayBuffer(asLittleEndian));
    }
    static fromHex(value, littleEndian = false) {
        if (value instanceof HexString) {
            return new HexString(value.toBigEndian());
        }
        return new HexString(value, littleEndian);
    }
    static fromArrayBuffer(value, littleEndian = false) {
        return new HexString(bytesToHex(value), littleEndian);
    }
    static fromBase64(value, littleEndian = false) {
        return new HexString(bytesToHex(base64ToBytes(value)), littleEndian);
    }
    static fromAscii(value) {
        return new HexString(Buffer.from(value, "utf8").toString("hex"));
    }
    static fromNumber(value) {
        const hex = value.toString(16);
        return new HexString(hex.length % 2 === 0 ? hex : `0${hex}`);
    }
}
