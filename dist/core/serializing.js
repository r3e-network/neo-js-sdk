import { concatBytes, toUint8Array } from "../internal/bytes.js";
export class BinaryWriter {
    chunks = [];
    write(data) {
        this.chunks.push(toUint8Array(data));
    }
    writeVarBytes(data) {
        const bytes = toUint8Array(data);
        this.writeVarInt(bytes.length);
        this.write(bytes);
    }
    writeVarString(value) {
        this.writeVarBytes(new TextEncoder().encode(value));
    }
    writeBool(value) {
        this.writeUInt8(value ? 1 : 0);
    }
    writeUInt8(value) {
        if (!Number.isInteger(value) || value < 0 || value > 0xff) {
            throw new Error("uint8 must be between 0 and 255");
        }
        this.write([value]);
    }
    writeUInt16LE(value) {
        if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
            throw new Error("uint16 must be between 0 and 65535");
        }
        const out = new Uint8Array(2);
        out[0] = value & 0xff;
        out[1] = (value >> 8) & 0xff;
        this.write(out);
    }
    writeUInt32LE(value) {
        if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
            throw new Error("uint32 must be between 0 and 4294967295");
        }
        const out = new Uint8Array(4);
        out[0] = value & 0xff;
        out[1] = (value >> 8) & 0xff;
        out[2] = (value >> 16) & 0xff;
        out[3] = (value >> 24) & 0xff;
        this.write(out);
    }
    writeUInt64LE(value) {
        const big = BigInt(value);
        if (big < 0n || big > 0xffffffffffffffffn) {
            throw new Error("uint64 must be between 0 and 2^64-1");
        }
        const out = new Uint8Array(8);
        let remaining = big;
        for (let index = 0; index < 8; index += 1) {
            out[index] = Number(remaining & 0xffn);
            remaining >>= 8n;
        }
        this.write(out);
    }
    writeVarInt(value) {
        const big = BigInt(value);
        if (big < 0n) {
            throw new Error("var int cannot be negative");
        }
        if (big < 0xfdn) {
            this.writeUInt8(Number(big));
            return;
        }
        if (big <= 0xffffn) {
            this.writeUInt8(0xfd);
            this.writeUInt16LE(Number(big));
            return;
        }
        if (big <= 0xffffffffn) {
            this.writeUInt8(0xfe);
            this.writeUInt32LE(Number(big));
            return;
        }
        if (big <= 0xffffffffffffffffn) {
            this.writeUInt8(0xff);
            this.writeUInt64LE(big);
            return;
        }
        throw new Error("var int exceeds 8 bytes");
    }
    writeMultiple(items) {
        this.writeVarInt(items.length);
        for (const item of items) {
            item.marshalTo(this);
        }
    }
    toBytes() {
        return concatBytes(...this.chunks);
    }
}
export class BinaryReader {
    data;
    index = 0;
    constructor(data) {
        this.data = data;
    }
    remaining() {
        return this.data.length - this.index;
    }
    read(length) {
        if (this.index + length > this.data.length) {
            throw new Error(`unexpected EOF: expected ${length} bytes, ${this.remaining()} available`);
        }
        const out = this.data.slice(this.index, this.index + length);
        this.index += length;
        return out;
    }
    readVarInt() {
        const tag = this.readUInt8();
        if (tag < 0xfd) {
            return BigInt(tag);
        }
        if (tag === 0xfd) {
            return BigInt(this.readUInt16LE());
        }
        if (tag === 0xfe) {
            return BigInt(this.readUInt32LE());
        }
        return this.readUInt64LE();
    }
    readVarBytes() {
        return this.read(Number(this.readVarInt()));
    }
    readVarString() {
        return new TextDecoder().decode(this.readVarBytes());
    }
    readBool() {
        const value = this.readUInt8();
        if (value !== 0 && value !== 1) {
            throw new Error("serialized bool must be 0 or 1");
        }
        return value === 1;
    }
    readUInt8() {
        return this.read(1)[0];
    }
    readUInt16LE() {
        const bytes = this.read(2);
        return bytes[0] | (bytes[1] << 8);
    }
    readUInt32LE() {
        const bytes = this.read(4);
        return bytes[0] + bytes[1] * 0x100 + bytes[2] * 0x10000 + bytes[3] * 0x1000000;
    }
    readUInt64LE() {
        const bytes = this.read(8);
        return (BigInt(bytes[0]) |
            (BigInt(bytes[1]) << 8n) |
            (BigInt(bytes[2]) << 16n) |
            (BigInt(bytes[3]) << 24n) |
            (BigInt(bytes[4]) << 32n) |
            (BigInt(bytes[5]) << 40n) |
            (BigInt(bytes[6]) << 48n) |
            (BigInt(bytes[7]) << 56n));
    }
    readMultiple(type) {
        const count = Number(this.readVarInt());
        if (count > this.remaining()) {
            throw new Error(`readMultiple: count ${count} exceeds remaining ${this.remaining()} bytes`);
        }
        const out = [];
        for (let index = 0; index < count; index += 1) {
            out.push(type.unmarshalFrom(this));
        }
        return out;
    }
}
export function serialize(value) {
    const writer = new BinaryWriter();
    value.marshalTo(writer);
    return writer.toBytes();
}
export function deserialize(data, type) {
    const reader = new BinaryReader(toUint8Array(data));
    return type.unmarshalFrom(reader);
}
