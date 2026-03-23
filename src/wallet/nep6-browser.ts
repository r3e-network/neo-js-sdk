import { base64ToBytes, bytesToBase64, bytesToHex, hexToBytes } from "../internal/bytes.js";
import { HexString } from "../compat/hex-string.js";
import {
  DEFAULT_ADDRESS_VERSION,
  constructMultiSigVerificationScript,
  getAddressFromScriptHash,
  getAddressVersion,
  getPrivateKeyFromWIF,
  getScriptHashFromAddress,
  getScriptHashFromVerificationScript,
  getVerificationScriptFromPublicKey,
  getWIFFromPrivateKey,
  isAddress,
  isPrivateKey,
  isPublicKey,
  isScriptHash,
  isWIF,
  normalizePublicKey,
  publicKeyFromPrivateKey,
  randomPrivateKeyHex,
  signHex,
} from "../compat/wallet-helpers.js";

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

function verificationScriptBase64(publicKey: string): string {
  return bytesToBase64(hexToBytes(getVerificationScriptFromPublicKey(publicKey)));
}

export class Account {
  public readonly addressVersion: number;
  public readonly label: string;
  public readonly isDefault: boolean;
  public readonly lock: boolean;
  public readonly contract: {
    script: string;
    parameters: Array<{ name: string; type: string }>;
    deployed: boolean;
  };

  private readonly privateKeyValue?: string;
  private readonly publicKeyValue?: string;
  private readonly scriptHashValue?: string;
  private readonly addressValue?: string;

  public constructor(
    value:
      | string
      | {
          address?: string;
          label?: string;
          isDefault?: boolean;
          lock?: boolean;
          contract?: {
            script: string;
            parameters: Array<{ name: string; type: string }>;
            deployed: boolean;
          };
        } = "",
    config: { addressVersion?: number } = {},
  ) {
    const detectedAddressVersion =
      typeof value === "string" && isAddress(value)
        ? getAddressVersion(value)
        : typeof value === "object" && value.address && isAddress(value.address)
          ? getAddressVersion(value.address)
          : undefined;

    this.addressVersion = config.addressVersion ?? detectedAddressVersion ?? DEFAULT_ADDRESS_VERSION;
    this.label = typeof value === "object" ? value.label ?? "" : "";
    this.isDefault = typeof value === "object" ? value.isDefault ?? false : false;
    this.lock = typeof value === "object" ? value.lock ?? false : false;
    this.contract =
      typeof value === "object" && value.contract
        ? {
            script: value.contract.script,
            parameters: [...value.contract.parameters],
            deployed: value.contract.deployed,
          }
        : { script: "", parameters: [], deployed: false };

    if (typeof value === "object") {
      this.addressValue = value.address;
      return;
    }

    if (!value) {
      const privateKey = randomPrivateKeyHex();
      this.privateKeyValue = privateKey;
      this.publicKeyValue = publicKeyFromPrivateKey(privateKey, true);
      this.contract = {
        script: verificationScriptBase64(this.publicKeyValue),
        parameters: [{ name: "signature", type: "Signature" }],
        deployed: false,
      };
      return;
    }

    if (isPrivateKey(value)) {
      this.privateKeyValue = value;
      this.publicKeyValue = publicKeyFromPrivateKey(value, true);
      this.contract = {
        script: verificationScriptBase64(this.publicKeyValue),
        parameters: [{ name: "signature", type: "Signature" }],
        deployed: false,
      };
      return;
    }

    if (isWIF(value)) {
      const privateKey = getPrivateKeyFromWIF(value);
      this.privateKeyValue = privateKey;
      this.publicKeyValue = publicKeyFromPrivateKey(privateKey, true);
      this.contract = {
        script: verificationScriptBase64(this.publicKeyValue),
        parameters: [{ name: "signature", type: "Signature" }],
        deployed: false,
      };
      return;
    }

    if (isPublicKey(value)) {
      this.publicKeyValue = normalizePublicKey(value, true);
      this.contract = {
        script: verificationScriptBase64(this.publicKeyValue),
        parameters: [{ name: "signature", type: "Signature" }],
        deployed: false,
      };
      return;
    }

    if (isScriptHash(value)) {
      this.scriptHashValue = HexString.fromHex(value).toBigEndian();
      return;
    }

    if (isAddress(value)) {
      this.addressValue = value;
      return;
    }

    throw new ReferenceError(`Invalid input: ${value}`);
  }

  public static fromWIF(wif: string): Account {
    return new Account(wif);
  }

  public static createMultiSig(signingThreshold: number, publicKeys: string[]): Account {
    const verificationScript = constructMultiSigVerificationScript(signingThreshold, publicKeys);
    return new Account({
      contract: {
        script: bytesToBase64(hexToBytes(verificationScript)),
        parameters: Array.from({ length: signingThreshold }, (_, index) => ({
          name: `signature${index}`,
          type: "Signature",
        })),
        deployed: false,
      },
    });
  }

  public get privateKey(): string {
    if (!this.privateKeyValue) {
      throw new Error("No Private Key provided");
    }
    return this.privateKeyValue;
  }

  public get publicKey(): HexString {
    if (this.publicKeyValue) {
      return HexString.fromHex(this.publicKeyValue);
    }
    if (this.privateKeyValue) {
      return HexString.fromHex(publicKeyFromPrivateKey(this.privateKeyValue, true));
    }
    throw new Error("No Public Key provided");
  }

  public get WIF(): string {
    return getWIFFromPrivateKey(this.privateKey);
  }

  public get scriptHash(): string {
    if (this.scriptHashValue) {
      return this.scriptHashValue;
    }
    if (this.addressValue) {
      return getScriptHashFromAddress(this.addressValue);
    }
    if (this.contract.script) {
      return getScriptHashFromVerificationScript(bytesToHex(base64ToBytes(this.contract.script)));
    }
    return getScriptHashFromAddress(this.address);
  }

  public get address(): string {
    if (this.addressValue) {
      return this.addressValue;
    }
    return getAddressFromScriptHash(this.scriptHash, this.addressVersion);
  }

  public sign(messageHex: string): string {
    return signHex(messageHex, this.privateKey);
  }
}

export class Wallet {
  public static readonly isAddress = isAddress;

  public constructor() {
    throw new Error("browser Wallet compatibility class only exposes static helpers");
  }
}
