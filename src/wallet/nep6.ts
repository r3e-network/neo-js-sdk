import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { wallet as neonWallet } from "@cityofzion/neon-core";
import { base64ToBytes, bytesToBase64 } from "../internal/bytes.js";
import { H160 } from "../core/hash.js";
import { PrivateKey, PublicKey } from "../core/keypair.js";
import { Witness } from "../core/witness.js";
import { ScryptParams, decryptSecp256r1Key, encryptSecp256r1Key } from "./nep2.js";

export class Parameter {
  public constructor(
    public readonly name: string,
    public readonly type: string,
  ) {}

  public toJSON(): { name: string; type: string } {
    return { name: this.name, type: this.type };
  }

  public static fromJSON(data: { name: string; type: string }): Parameter {
    return new Parameter(data.name, data.type);
  }
}

export class Contract {
  public constructor(
    public readonly script: Uint8Array,
    public readonly parameters: Parameter[],
    public readonly deployed = false,
  ) {}

  public toJSON(): {
    script: string;
    parameters: Array<{ name: string; type: string }>;
    deployed: boolean;
  } {
    return {
      script: bytesToBase64(this.script),
      parameters: this.parameters.map((parameter) => parameter.toJSON()),
      deployed: this.deployed,
    };
  }

  public static fromJSON(data: {
    script: string;
    parameters: Array<{ name: string; type: string }>;
    deployed: boolean;
  }): Contract {
    return new Contract(
      base64ToBytes(data.script),
      data.parameters.map((parameter) => Parameter.fromJSON(parameter)),
      data.deployed,
    );
  }
}

export interface AccountOptions {
  address: string;
  key: string;
  contract: Contract | null;
  label?: string;
  isDefault?: boolean;
  locked?: boolean;
}

export class Account {
  private privateKey: PrivateKey | null = null;

  public readonly address: string;
  public readonly key: string;
  public readonly contract: Contract | null;
  public readonly label: string;
  public readonly isDefault: boolean;
  public readonly locked: boolean;

  public constructor({ address, key, contract, label = "", isDefault = false, locked = false }: AccountOptions) {
    this.address = address;
    this.key = key;
    this.contract = contract;
    this.label = label;
    this.isDefault = isDefault;
    this.locked = locked;
  }

  public setPrivateKey(privateKey: PrivateKey): void {
    this.privateKey = privateKey;
  }

  public watchOnly(): boolean {
    return this.contract === null;
  }

  public decrypt(passphrase: string, addressVersion = 53, scrypt = new ScryptParams()): PublicKey {
    this.privateKey = decryptSecp256r1Key(this.key, passphrase, addressVersion, scrypt);
    return this.privateKey.publicKey();
  }

  public signable(): boolean {
    return this.privateKey !== null && !this.locked && !this.watchOnly();
  }

  public sign(message: Uint8Array): Uint8Array {
    if (this.privateKey === null) {
      throw new Error("account is locked");
    }
    return this.privateKey.sign(message);
  }

  public signWitness(signData: Uint8Array): Witness {
    if (this.privateKey === null) {
      throw new Error("account is locked");
    }
    return this.privateKey.signWitness(signData);
  }

  public getScriptHash(): H160 {
    if (this.privateKey !== null) {
      return this.privateKey.publicKey().getScriptHash();
    }
    return new H160(`0x${neonWallet.getScriptHashFromAddress(this.address)}`);
  }

  public toJSON(): {
    address: string;
    key: string;
    label: string;
    isDefault: boolean;
    lock: boolean;
    contract: ReturnType<Contract["toJSON"]> | null;
  } {
    if (this.contract === null) {
      throw new Error("neo: watch-only account cannot be serialized to NEP-6 by this compatibility layer");
    }
    return {
      address: this.address,
      key: this.key,
      label: this.label,
      isDefault: this.isDefault,
      lock: this.locked,
      contract: this.contract.toJSON(),
    };
  }

  public static fromJSON(data: {
    address: string;
    key: string;
    label: string;
    isDefault: boolean;
    lock: boolean;
    contract: {
      script: string;
      parameters: Array<{ name: string; type: string }>;
      deployed: boolean;
    } | null;
  }): Account {
    if (data.contract === null || data.contract === undefined) {
      throw new Error("contract is required in NEP-6 JSON");
    }
    return new Account({
      address: data.address,
      key: data.key,
      label: data.label,
      isDefault: data.isDefault,
      locked: data.lock,
      contract: Contract.fromJSON(data.contract),
    });
  }
}

export interface WalletOptions {
  name: string;
  accounts?: Account[];
  scrypt?: ScryptParams;
  passphrase?: string;
  version?: string;
}

export class Wallet {
  public readonly name: string;
  public readonly version: string;
  public readonly scrypt: ScryptParams;
  public readonly accounts: Account[];
  private passphrase?: string;

  public constructor({ name, accounts = [], scrypt = new ScryptParams(), passphrase, version = "1.0" }: WalletOptions) {
    this.name = name;
    this.accounts = accounts;
    this.scrypt = scrypt;
    this.version = version;
    this.passphrase = passphrase;
  }

  public createAccount(): Account {
    if (!this.passphrase) {
      throw new Error("passphrase is not set");
    }

    const privateKey = new PrivateKey();
    const publicKey = privateKey.publicKey();
    const address = publicKey.getAddress();
    const contract = new Contract(publicKey.getSignatureRedeemScript(), [new Parameter("signature", "Signature")]);
    const key = encryptSecp256r1Key(privateKey, this.passphrase, 53, this.scrypt);

    const account = new Account({
      address,
      key,
      contract,
    });
    account.setPrivateKey(privateKey);
    this.accounts.push(account);
    return account;
  }

  public decrypt(passphrase: string): void {
    this.passphrase = passphrase;
    for (const account of this.accounts) {
      account.decrypt(passphrase, 53, this.scrypt);
    }
  }

  public writeToFile(path: string): void {
    if (existsSync(path)) {
      throw new Error(`wallet file ${path} already exists`);
    }
    writeFileSync(path, JSON.stringify(this.toJSON()), "utf8");
  }

  public toJSON(): {
    name: string;
    version: string;
    scrypt: ReturnType<ScryptParams["toJSON"]>;
    accounts: ReturnType<Account["toJSON"]>[];
  } {
    return {
      name: this.name,
      version: this.version,
      scrypt: this.scrypt.toJSON(),
      accounts: this.accounts.map((account) => account.toJSON()),
    };
  }

  public static fromJSON(data: {
    name: string;
    version: string;
    scrypt: { n: number; r: number; p: number };
    accounts: Array<{
      address: string;
      key: string;
      label: string;
      isDefault: boolean;
      lock: boolean;
      contract: {
        script: string;
        parameters: Array<{ name: string; type: string }>;
        deployed: boolean;
      } | null;
    }>;
  }): Wallet {
    return new Wallet({
      name: data.name,
      version: data.version,
      scrypt: ScryptParams.fromJSON(data.scrypt),
      accounts: data.accounts.map((account) => Account.fromJSON(account)),
    });
  }

  public static openNep6Wallet(path: string): Wallet {
    const raw = readFileSync(path, "utf8");
    return Wallet.fromJSON(JSON.parse(raw) as ReturnType<Wallet["toJSON"]>);
  }
}
