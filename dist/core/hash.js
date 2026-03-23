import { bytesToHex, equalBytes, hexToBytes, reverseBytes, toUint8Array } from "../internal/bytes.js";
class HashBase {
    byteLength;
    data;
    constructor(byteLength, data) {
        this.byteLength = byteLength;
        this.data = data;
        if (data.length !== byteLength) {
            throw new Error(`Hash must be ${byteLength} bytes`);
        }
    }
    toBytes() {
        return this.data.slice();
    }
    marshalTo(writer) {
        writer.write(this.data);
    }
    toString() {
        return `0x${bytesToHex(reverseBytes(this.data))}`;
    }
    equals(other) {
        const comparable = typeof other === "string" ? new this.constructor(other) : other;
        return equalBytes(this.data, comparable.data);
    }
}
export class H160 extends HashBase {
    constructor(value) {
        const data = typeof value === "string"
            ? reverseBytes(hexToBytes(value))
            : value === undefined
                ? new Uint8Array(20)
                : toUint8Array(value);
        super(20, data);
    }
    static unmarshalFrom(reader) {
        return new H160(reader.read(20));
    }
}
export class H256 extends HashBase {
    constructor(value) {
        const data = typeof value === "string"
            ? reverseBytes(hexToBytes(value))
            : value === undefined
                ? new Uint8Array(32)
                : toUint8Array(value);
        super(32, data);
    }
    static unmarshalFrom(reader) {
        return new H256(reader.read(32));
    }
}
