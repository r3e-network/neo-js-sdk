import { createCipheriv, createDecipheriv, createHash, scryptSync } from "node:crypto";
import bs58 from "bs58";
import { PrivateKey } from "../core/keypair.js";

/** NEP-2 encrypted key prefix: 0x01 0x42 0xe0 (flag byte = 0xe0 for secp256r1) */
const NEP2_PREFIX = Buffer.from([0x01, 0x42, 0xe0]);

export class ScryptParams {
  public constructor(
    public readonly n = 16384,
    public readonly r = 8,
    public readonly p = 8,
  ) {}

  public toJSON(): { n: number; r: number; p: number } {
    return { n: this.n, r: this.r, p: this.p };
  }

  public static fromJSON(data: { n: number; r: number; p: number }): ScryptParams {
    return new ScryptParams(data.n, data.r, data.p);
  }
}

function addressHash(address: string): Buffer {
  const first = createHash("sha256").update(address, "utf8").digest();
  return createHash("sha256").update(first).digest().subarray(0, 4);
}

function computeChecksum(payload: Uint8Array): Buffer {
  return createHash("sha256").update(createHash("sha256").update(payload).digest()).digest().subarray(0, 4);
}

function base58CheckEncode(payload: Uint8Array): string {
  const checksum = computeChecksum(payload);
  return bs58.encode(Buffer.concat([Buffer.from(payload), checksum]));
}

function base58CheckDecode(value: string): Buffer {
  const decoded = Buffer.from(bs58.decode(value));
  if (decoded.length < 5) {
    throw new Error("NEP-2: invalid base58check key");
  }
  const payload = decoded.subarray(0, -4);
  const checksum = decoded.subarray(-4);
  if (!checksum.equals(computeChecksum(payload))) {
    throw new Error("NEP-2: invalid base58check checksum");
  }
  return payload;
}

function deriveKey(passphrase: string, salt: Buffer, scrypt: ScryptParams): Buffer {
  return scryptSync(passphrase.normalize("NFC"), salt, 64, {
    N: scrypt.n,
    r: scrypt.r,
    p: scrypt.p,
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
  scrypt = new ScryptParams(),
): string {
  const checksum = addressHash(privateKey.publicKey().getAddress(addressVersion));
  const derived = deriveKey(passphrase, checksum, scrypt);
  const secretBytes = Buffer.from(privateKey.toBytes());
  const xor = Buffer.allocUnsafe(32);
  for (let index = 0; index < 32; index += 1) {
    xor[index] = secretBytes[index] ^ derived[index];
  }
  const encrypted = encryptAesEcb(derived.subarray(32), xor);
  const payload = Buffer.concat([NEP2_PREFIX, checksum, encrypted]);
  return base58CheckEncode(payload);
}

export function decryptSecp256r1Key(
  key: string,
  passphrase: string,
  addressVersion = 53,
  scrypt = new ScryptParams(),
): PrivateKey {
  const payload = base58CheckDecode(key);
  if (payload.length !== 39) {
    throw new Error("NEP-2 key must be 39 bytes");
  }
  if (!payload.subarray(0, 3).equals(NEP2_PREFIX)) {
    throw new Error("NEP-2 key has invalid prefix");
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
    throw new Error("NEP-2 checksum mismatch");
  }
  return privateKey;
}
