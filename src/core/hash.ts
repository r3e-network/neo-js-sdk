import { BytesLike, bytesToHex, equalBytes, hexToBytes, reverseBytes, toUint8Array } from "../internal/bytes.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";

abstract class HashBase {
  protected constructor(
    private readonly byteLength: number,
    protected readonly data: Uint8Array
  ) {
    if (data.length !== byteLength) {
      throw new Error(`Hash must be ${byteLength} bytes`);
    }
  }

  public toBytes(): Uint8Array {
    return this.data.slice();
  }

  public marshalTo(writer: BinaryWriter): void {
    writer.write(this.data);
  }

  public toString(): string {
    return `0x${bytesToHex(reverseBytes(this.data))}`;
  }

  public equals(other: HashBase | string): boolean {
    const comparable =
      typeof other === "string" ? new (this.constructor as new (value: string) => HashBase)(other) : other;
    return equalBytes(this.data, comparable.data);
  }
}

export class H160 extends HashBase {
  public constructor(value?: BytesLike | string) {
    const data =
      typeof value === "string"
        ? reverseBytes(hexToBytes(value))
        : value === undefined
          ? new Uint8Array(20)
          : toUint8Array(value);
    super(20, data);
  }

  public static unmarshalFrom(reader: BinaryReader): H160 {
    return new H160(reader.read(20));
  }
}

export class H256 extends HashBase {
  public constructor(value?: BytesLike | string) {
    const data =
      typeof value === "string"
        ? reverseBytes(hexToBytes(value))
        : value === undefined
          ? new Uint8Array(32)
          : toUint8Array(value);
    super(32, data);
  }

  public static unmarshalFrom(reader: BinaryReader): H256 {
    return new H256(reader.read(32));
  }
}
