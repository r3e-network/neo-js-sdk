import { createCipheriv, createDecipheriv, createHash, scryptSync } from "node:crypto";
import bs58 from "bs58";
import { wallet as neonWallet } from "@cityofzion/neon-core";
import { PrivateKey } from "../core/keypair.js";

export class ScryptParams {
  public constructor(
    public readonly n = 16384,
    public readonly r = 8,
    public readonly p = 8
  ) {}

  public toJSON(): { n: number; r: number; p: number } {
    return { n: this.n, r: this.r, p: this.p };
  }

  public to_json(): { n: number; r: number; p: number } {
    return this.toJSON();
  }

  public static fromJSON(data: { n: number; r: number; p: number }): ScryptParams {
    return new ScryptParams(data.n, data.r, data.p);
  }

  public static from_json(data: { n: number; r: number; p: number }): ScryptParams {
    return ScryptParams.fromJSON(data);
  }
}

function addressHash(address: string): Buffer {
  const first = createHash("sha256").update(address, "utf8").digest();
  return createHash("sha256").update(first).digest().subarray(0, 4);
}

function base58CheckEncode(payload: Uint8Array): string {
  const checksum = createHash("sha256")
    .update(createHash("sha256").update(payload).digest())
    .digest()
    .subarray(0, 4);
  return bs58.encode(Buffer.concat([Buffer.from(payload), checksum]));
}

function base58CheckDecode(value: string): Buffer {
  const decoded = Buffer.from(bs58.decode(value));
  if (decoded.length < 5) {
    throw new Error("neo: invalid base58check key");
  }
  const payload = decoded.subarray(0, -4);
  const checksum = decoded.subarray(-4);
  const expected = createHash("sha256")
    .update(createHash("sha256").update(payload).digest())
    .digest()
    .subarray(0, 4);
  if (!checksum.equals(expected)) {
    throw new Error("neo: invalid base58check key");
  }
  return payload;
}

function deriveKey(passphrase: string, salt: Buffer, scrypt: ScryptParams): Buffer {
  return scryptSync(passphrase.normalize("NFC"), salt, 64, {
    N: scrypt.n,
    r: scrypt.r,
    p: scrypt.p
  });
}

function encryptAesEcb(key: Buffer, value: Buffer): Buffer {
  const cipher = createCipheriv("aes-256-ecb", key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(value), cipher.final()]);
}

function decryptAesEcb(key: Buffer, value: Buffer): Buffer {
  const decipher = createDecipheriv("aes-256-ecb", key, null);
  decipher.setAutoPadding(false);
  return Buffer.concat([decipher.update(value), decipher.final()]);
}

export function encryptSecp256r1Key(
  privateKey: PrivateKey,
  passphrase: string,
  addressVersion = 53,
  scrypt = new ScryptParams()
): string {
  const checksum = addressHash(privateKey.publicKey().getAddress(addressVersion));
  const derived = deriveKey(passphrase, checksum, scrypt);
  const secretBytes = Buffer.from(privateKey.toBytes());
  const xor = Buffer.allocUnsafe(32);
  for (let index = 0; index < 32; index += 1) {
    xor[index] = secretBytes[index] ^ derived[index];
  }
  const encrypted = encryptAesEcb(derived.subarray(32), xor);
  const payload = Buffer.concat([Buffer.from([0x01, 0x42, 0xe0]), checksum, encrypted]);
  return base58CheckEncode(payload);
}

export function decryptSecp256r1Key(
  key: string,
  passphrase: string,
  addressVersion = 53,
  scrypt = new ScryptParams()
): PrivateKey {
  const payload = base58CheckDecode(key);
  if (payload.length !== 39) {
    throw new Error("neo: invalid key(it must be 39 bytes)");
  }
  if (!payload.subarray(0, 3).equals(Buffer.from([0x01, 0x42, 0xe0]))) {
    throw new Error("neo: invalid key(it must start with '\\x01\\x42\\xe0')");
  }

  const checksum = payload.subarray(3, 7);
  const encrypted = payload.subarray(7);
  const derived = deriveKey(passphrase, checksum, scrypt);
  const decrypted = decryptAesEcb(derived.subarray(32), encrypted);
  const secretBytes = Buffer.allocUnsafe(32);
  for (let index = 0; index < 32; index += 1) {
    secretBytes[index] = decrypted[index] ^ derived[index];
  }
  const privateKey = new PrivateKey(secretBytes);
  const address = privateKey.publicKey().getAddress(addressVersion);
  if (!addressHash(address).equals(checksum)) {
    throw new Error("neo: nep2 checksum mismatch");
  }
  return privateKey;
}

export const encrypt_secp256r1_key = encryptSecp256r1Key;
export const decrypt_secp256r1_key = decryptSecp256r1Key;
