import { wallet } from "@cityofzion/neon-core";
import { randomBytes } from "node:crypto";
import { bytesToHex, equalBytes, hexToBytes, toUint8Array } from "../internal/bytes.js";
import { H160 } from "./hash.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";
import { ScriptBuilder } from "./script.js";
import { Witness } from "./witness.js";

function privateKeyToHex(value?: Uint8Array | string | bigint | number): string {
  if (typeof value === "string") {
    const bytes = hexToBytes(value);
    if (bytes.length !== 32) {
      throw new Error("invalid secp256r1 private key");
    }
    return bytesToHex(bytes);
  }
  if (typeof value === "bigint" || typeof value === "number") {
    let remaining = BigInt(value);
    const bytes = new Uint8Array(32);
    for (let index = 31; index >= 0; index -= 1) {
      bytes[index] = Number(remaining & 0xffn);
      remaining >>= 8n;
    }
    return bytesToHex(bytes);
  }
  if (value instanceof Uint8Array) {
    if (value.length !== 32) {
      throw new Error("invalid secp256r1 private key");
    }
    return bytesToHex(value);
  }
  return bytesToHex(randomBytes(32));
}

export class PrivateKey {
  private readonly hex: string;

  public constructor(value?: Uint8Array | string | bigint | number) {
    this.hex = privateKeyToHex(value);
  }

  public publicKey(): PublicKey {
    return new PublicKey(wallet.getPublicKeyFromPrivateKey(this.hex));
  }

  public public_key(): PublicKey {
    return this.publicKey();
  }

  public sign(message: Uint8Array): Uint8Array {
    return hexToBytes(wallet.sign(bytesToHex(message), this.hex));
  }

  public signWitness(signData: Uint8Array): Witness {
    const signature = this.sign(signData);
    const invocation = new ScriptBuilder().emitPush(signature).toBytes();
    const verification = this.publicKey().getSignatureRedeemScript();
    return new Witness(invocation, verification);
  }

  public sign_witness(signData: Uint8Array): Witness {
    return this.signWitness(signData);
  }

  public toBytes(): Uint8Array {
    return hexToBytes(this.hex);
  }

  public to_bytes(): Uint8Array {
    return this.toBytes();
  }
}

export class PublicKey {
  private readonly hex: string;

  public constructor(value: Uint8Array | string) {
    const bytes = typeof value === "string" ? hexToBytes(value) : toUint8Array(value);
    if (![33, 65].includes(bytes.length)) {
      throw new Error("unsupported public key");
    }
    this.hex = bytesToHex(bytes);
  }

  public getScriptHash(): H160 {
    return new H160(`0x${wallet.getScriptHashFromPublicKey(this.hex)}`);
  }

  public get_script_hash(): H160 {
    return this.getScriptHash();
  }

  public getAddress(addressVersion = 53): string {
    return wallet.getAddressFromScriptHash(wallet.getScriptHashFromPublicKey(this.hex), addressVersion);
  }

  public get_address(addressVersion = 53): string {
    return this.getAddress(addressVersion);
  }

  public getSignatureRedeemScript(): Uint8Array {
    return hexToBytes(wallet.getVerificationScriptFromPublicKey(this.hex));
  }

  public get_signature_redeem_script(): Uint8Array {
    return this.getSignatureRedeemScript();
  }

  public verify(message: Uint8Array, signature: Uint8Array): boolean {
    return wallet.verify(bytesToHex(message), bytesToHex(signature), this.hex);
  }

  public toBytes(): Uint8Array {
    return hexToBytes(this.hex);
  }

  public to_bytes(): Uint8Array {
    return this.toBytes();
  }

  public marshalTo(writer: BinaryWriter): void {
    writer.write(this.toBytes());
  }

  public static unmarshalFrom(reader: BinaryReader): PublicKey {
    const prefix = reader.readUInt8();
    if (prefix === 0x02 || prefix === 0x03) {
      return new PublicKey(Uint8Array.of(prefix, ...reader.read(32)));
    }
    if (prefix === 0x04) {
      return new PublicKey(Uint8Array.of(prefix, ...reader.read(64)));
    }
    throw new Error(`unexpected PublicKey prefix: ${prefix}`);
  }

  public toString(): string {
    return this.hex;
  }

  public equals(other: PublicKey | string): boolean {
    const comparable = typeof other === "string" ? new PublicKey(other) : other;
    return equalBytes(this.toBytes(), comparable.toBytes());
  }
}
