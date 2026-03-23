import { bytesToHex, hexToBytes } from "../internal/bytes.js";
import { normalizeHex } from "../internal/hex.js";

function bytesToBase64(value: Uint8Array): string {
  return Buffer.from(value).toString("base64");
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

function reverseHex(value: string): string {
  return bytesToHex(hexToBytes(value).reverse());
}

export class HexString {
  private readonly value: string;

  public constructor(value: string, littleEndian = false) {
    const normalized = normalizeHex(value);
    this.value = littleEndian ? reverseHex(normalized) : normalized;
  }

  public get length(): number {
    return this.value.length;
  }

  public get byteLength(): number {
    return this.value.length / 2;
  }

  public toString(): string {
    return this.value;
  }

  public toHex(): string {
    return this.value;
  }

  public toJSON(): string {
    return this.value;
  }

  public toBigEndian(): string {
    return this.value;
  }

  public toLittleEndian(): string {
    return reverseHex(this.value);
  }

  public reversed(): HexString {
    return new HexString(this.toLittleEndian());
  }

  public equals(other: HexString | string): boolean {
    return this.value === HexString.fromHex(typeof other === "string" ? other : other.toBigEndian()).toBigEndian();
  }

  public toNumber(asLittleEndian = false): number {
    return parseInt(asLittleEndian ? this.toLittleEndian() : this.toBigEndian(), 16);
  }

  public toArrayBuffer(asLittleEndian = false): Uint8Array {
    return hexToBytes(asLittleEndian ? this.toLittleEndian() : this.toBigEndian());
  }

  public toBase64(asLittleEndian = false): string {
    return bytesToBase64(this.toArrayBuffer(asLittleEndian));
  }

  public static fromHex(value: HexString | string, littleEndian = false): HexString {
    if (value instanceof HexString) {
      return new HexString(value.toBigEndian());
    }
    return new HexString(value, littleEndian);
  }

  public static fromArrayBuffer(value: Uint8Array, littleEndian = false): HexString {
    return new HexString(bytesToHex(value), littleEndian);
  }

  public static fromBase64(value: string, littleEndian = false): HexString {
    return new HexString(bytesToHex(base64ToBytes(value)), littleEndian);
  }

  public static fromAscii(value: string): HexString {
    return new HexString(Buffer.from(value, "utf8").toString("hex"));
  }

  public static fromNumber(value: number): HexString {
    const hex = value.toString(16);
    return new HexString(hex.length % 2 === 0 ? hex : `0${hex}`);
  }
}
