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

export async function encryptSecp256r1Key(
  privateKey: PrivateKey,
  passphrase: string,
  addressVersion = 53,
  scrypt = new ScryptParams()
): Promise<string> {
  return neonWallet.encrypt(Buffer.from(privateKey.toBytes()).toString("hex"), passphrase, scrypt, addressVersion);
}

export async function decryptSecp256r1Key(
  key: string,
  passphrase: string,
  addressVersion = 53,
  scrypt = new ScryptParams()
): Promise<PrivateKey> {
  const wif = await neonWallet.decrypt(key, passphrase, scrypt, addressVersion);
  return new PrivateKey(neonWallet.getPrivateKeyFromWIF(wif));
}

export const encrypt_secp256r1_key = encryptSecp256r1Key;
export const decrypt_secp256r1_key = decryptSecp256r1Key;
