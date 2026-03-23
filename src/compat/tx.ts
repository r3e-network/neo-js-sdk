import { bytesToHex, hexToBytes } from "../internal/bytes.js";
import { type SignerJson, Signer, Tx } from "../core/tx.js";
import { BinaryWriter, deserialize } from "../core/serializing.js";
import { WitnessScope } from "../core/witness.js";
import { reverseHex } from "../utils.js";
import { HexString } from "./hex-string.js";
import { sha256Bytes } from "./hashes.js";
import { getPrivateKeyFromWIF, isWIF } from "./wallet-helpers.js";
import { PrivateKey } from "../core/keypair.js";
import { Witness as CoreWitness } from "../core/witness.js";

type SignerLike = Signer | SignerJson | Record<string, unknown>;

function normalizeSigner(signer: SignerLike): SignerJson {
  if (signer instanceof Signer) {
    return signer.toJSON();
  }
  if (typeof signer === "object" && signer !== null && "toJSON" in signer && typeof signer.toJSON === "function") {
    return signer.toJSON() as SignerJson;
  }
  return signer as SignerJson;
}

function signerToCore(signer: SignerLike): Signer {
  if (signer instanceof Signer) {
    return signer;
  }

  const json = normalizeSigner(signer);
  if ((json.rules ?? []).length > 0) {
    throw new Error("Witness rules are not yet supported in browser compatibility mode");
  }
  return new Signer({
    account: json.account,
    scopes: typeof json.scopes === "string" ? parseWitnessScope(json.scopes) : (json.scopes as WitnessScope),
    allowedContracts: json.allowedcontracts ?? [],
    allowedGroups: json.allowedgroups ?? [],
    rules: [],
  });
}

function parseWitnessScope(value: string): WitnessScope {
  if (value === "None") {
    return WitnessScope.None;
  }
  return value
    .split(",")
    .map((part) => WitnessScope[part.trim() as keyof typeof WitnessScope])
    .reduce((sum, current) => (sum | current) as WitnessScope, WitnessScope.None);
}

function resolvePrivateKey(signingKey: string | { privateKey: string }): string {
  if (typeof signingKey === "object" && signingKey !== null && typeof signingKey.privateKey === "string") {
    return signingKey.privateKey;
  }
  if (typeof signingKey !== "string") {
    throw new Error("unsupported signing key");
  }
  return isWIF(signingKey) ? getPrivateKeyFromWIF(signingKey) : signingKey;
}

export class Witness {
  public readonly invocation: string;
  public readonly verification: string;

  public constructor({
    invocationScript,
    verificationScript,
  }: {
    invocationScript: string | HexString | Uint8Array;
    verificationScript: string | HexString | Uint8Array;
  }) {
    this.invocation = normalizeHexLike(invocationScript);
    this.verification = normalizeHexLike(verificationScript);
  }

  public get invocationScript(): string {
    return this.invocation;
  }

  public get verificationScript(): string {
    return this.verification;
  }

  public toJSON(): { invocation: string; verification: string } {
    return {
      invocation: HexString.fromHex(this.invocation).toBase64(),
      verification: HexString.fromHex(this.verification).toBase64(),
    };
  }

  public toJson(): { invocation: string; verification: string } {
    return this.toJSON();
  }

  public toCoreWitness(): CoreWitness {
    return new CoreWitness(hexToBytes(this.invocation), hexToBytes(this.verification));
  }

  public static fromCoreWitness(witness: CoreWitness): Witness {
    return new Witness({
      invocationScript: bytesToHex(witness.invocationScript),
      verificationScript: bytesToHex(witness.verificationScript),
    });
  }
}

function normalizeHexLike(value: string | HexString | Uint8Array): string {
  if (value instanceof HexString) {
    return value.toBigEndian();
  }
  if (value instanceof Uint8Array) {
    return bytesToHex(value);
  }
  return HexString.fromHex(value).toBigEndian();
}

export class Transaction {
  public readonly version = 0;
  public nonce: number;
  public systemFee: bigint;
  public networkFee: bigint;
  public validUntilBlock: number;
  public script: HexString;
  public signers: SignerLike[];
  public attributes: Tx["attributes"];
  public witnesses: Witness[];

  public constructor({
    nonce = 0,
    systemFee = 0,
    networkFee = 0,
    validUntilBlock = 0,
    script = "",
    signers = [],
    witnesses = [],
    attributes = [],
  }: {
    nonce?: number;
    systemFee?: bigint | number | string;
    networkFee?: bigint | number | string;
    validUntilBlock?: number;
    script?: string | HexString | Uint8Array;
    signers?: SignerLike[];
    witnesses?: Array<Witness | { invocationScript: string | HexString | Uint8Array; verificationScript: string | HexString | Uint8Array }>;
    attributes?: Tx["attributes"];
  } = {}) {
    this.nonce = nonce;
    this.systemFee = BigInt(systemFee);
    this.networkFee = BigInt(networkFee);
    this.validUntilBlock = validUntilBlock;
    this.script = script instanceof HexString ? script : script instanceof Uint8Array ? HexString.fromArrayBuffer(script) : HexString.fromHex(script);
    this.signers = signers;
    this.attributes = attributes;
    this.witnesses = witnesses.map((witness) => (witness instanceof Witness ? witness : new Witness(witness)));
  }

  private toCoreTx(includeWitnesses = true): Tx {
    return new Tx({
      nonce: this.nonce,
      systemFee: this.systemFee,
      networkFee: this.networkFee,
      validUntilBlock: this.validUntilBlock,
      script: this.script.toArrayBuffer(),
      signers: this.signers.map(signerToCore),
      attributes: this.attributes,
      witnesses: includeWitnesses ? this.witnesses.map((witness) => witness.toCoreWitness()) : [],
    });
  }

  public serialize(signed = true): string {
    const tx = this.toCoreTx(signed);
    if (signed) {
      return bytesToHex(tx.toBytes());
    }
    const writer = new BinaryWriter();
    tx.marshalUnsignedTo(writer);
    return bytesToHex(writer.toBytes());
  }

  public hash(): string {
    return reverseHex(bytesToHex(sha256Bytes(hexToBytes(this.serialize(false)))));
  }

  public sign(signingKey: string | { privateKey: string }, networkMagic: number): this {
    const tx = this.toCoreTx(false);
    const witness = new PrivateKey(resolvePrivateKey(signingKey)).signWitness(tx.getSignData(networkMagic));
    const compatWitness = Witness.fromCoreWitness(witness);
    const existingIndex = this.witnesses.findIndex(
      (item) => item.verification.toLowerCase() === compatWitness.verification.toLowerCase(),
    );
    if (existingIndex >= 0) {
      this.witnesses.splice(existingIndex, 1, compatWitness);
    } else {
      this.witnesses.push(compatWitness);
    }
    return this;
  }

  public static deserialize(hex: string): Transaction {
    const tx = deserialize(hexToBytes(hex), Tx);
    return new Transaction({
      nonce: tx.nonce,
      systemFee: tx.systemFee,
      networkFee: tx.networkFee,
      validUntilBlock: tx.validUntilBlock,
      script: tx.script,
      signers: tx.signers.map((signer) => signer.toJSON()),
      attributes: tx.attributes,
      witnesses: tx.witnesses.map((witness) => Witness.fromCoreWitness(witness)),
    });
  }
}
