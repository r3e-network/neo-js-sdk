import { BytesLike, concatBytes, toUint8Array } from "../internal/bytes.js";

type Marshaled = {
  marshalTo(writer: BinaryWriter): void;
};

type Unmarshalable<T> = {
  unmarshalFrom(reader: BinaryReader): T;
};

export class BinaryWriter {
  private readonly chunks: Uint8Array[] = [];

  public write(data: BytesLike): void {
    this.chunks.push(toUint8Array(data));
  }

  public writeVarBytes(data: BytesLike): void {
    const bytes = toUint8Array(data);
    this.writeVarInt(bytes.length);
    this.write(bytes);
  }

  public writeVarString(value: string): void {
    this.writeVarBytes(new TextEncoder().encode(value));
  }

  public writeBool(value: boolean): void {
    this.writeUInt8(value ? 1 : 0);
  }

  public writeUInt8(value: number): void {
    if (!Number.isInteger(value) || value < 0 || value > 0xff) {
      throw new Error("uint8 must be between 0 and 255");
    }
    this.write([value]);
  }

  public writeUInt16LE(value: number): void {
    if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
      throw new Error("uint16 must be between 0 and 65535");
    }
    const out = new Uint8Array(2);
    out[0] = value & 0xff;
    out[1] = (value >> 8) & 0xff;
    this.write(out);
  }

  public writeUInt32LE(value: number): void {
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

  public writeUInt64LE(value: bigint | number): void {
    const big = BigInt(value);
    if (big < 0n || big > 0xffff_ffff_ffff_ffffn) {
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

  public writeVarInt(value: bigint | number): void {
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
    if (big <= 0xffff_ffffn) {
      this.writeUInt8(0xfe);
      this.writeUInt32LE(Number(big));
      return;
    }
    if (big <= 0xffff_ffff_ffff_ffffn) {
      this.writeUInt8(0xff);
      this.writeUInt64LE(big);
      return;
    }
    throw new Error("var int exceeds 8 bytes");
  }

  public writeMultiple(items: Marshaled[]): void {
    this.writeVarInt(items.length);
    for (const item of items) {
      item.marshalTo(this);
    }
  }

  public toBytes(): Uint8Array {
    return concatBytes(...this.chunks);
  }
}

export class BinaryReader {
  private index = 0;

  public constructor(private readonly data: Uint8Array) {}

  public remaining(): number {
    return this.data.length - this.index;
  }

  public read(length: number): Uint8Array {
    if (this.index + length > this.data.length) {
      throw new Error(`unexpected EOF: expected ${length} bytes, ${this.remaining()} available`);
    }
    const out = this.data.slice(this.index, this.index + length);
    this.index += length;
    return out;
  }

  public readVarInt(): bigint {
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

  public readVarBytes(): Uint8Array {
    return this.read(Number(this.readVarInt()));
  }

  public readVarString(): string {
    return new TextDecoder().decode(this.readVarBytes());
  }

  public readBool(): boolean {
    const value = this.readUInt8();
    if (value !== 0 && value !== 1) {
      throw new Error("serialized bool must be 0 or 1");
    }
    return value === 1;
  }

  public readUInt8(): number {
    return this.read(1)[0];
  }

  public readUInt16LE(): number {
    const bytes = this.read(2);
    return bytes[0] | (bytes[1] << 8);
  }

  public readUInt32LE(): number {
    const bytes = this.read(4);
    return bytes[0] + bytes[1] * 0x100 + bytes[2] * 0x10000 + bytes[3] * 0x1000000;
  }

  public readUInt64LE(): bigint {
    const bytes = this.read(8);
    let result = 0n;
    for (let index = 7; index >= 0; index -= 1) {
      result = (result << 8n) | BigInt(bytes[index]);
    }
    return result;
  }

  public readMultiple<T>(type: Unmarshalable<T>): T[] {
    const count = Number(this.readVarInt());
    if (count > this.remaining()) {
      throw new Error(`readMultiple: count ${count} exceeds remaining ${this.remaining()} bytes`);
    }
    const out: T[] = [];
    for (let index = 0; index < count; index += 1) {
      out.push(type.unmarshalFrom(this));
    }
    return out;
  }
}

export function serialize(value: Marshaled): Uint8Array {
  const writer = new BinaryWriter();
  value.marshalTo(writer);
  return writer.toBytes();
}

export function deserialize<T>(data: BytesLike, type: Unmarshalable<T>): T {
  const reader = new BinaryReader(toUint8Array(data));
  return type.unmarshalFrom(reader);
}
