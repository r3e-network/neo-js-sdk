import { bytesToBase64, equalBytes } from "../internal/bytes.js";
import { BinaryReader, BinaryWriter } from "./serializing.js";

export enum WitnessScope {
  NONE = 0x00,
  None = 0x00,
  CalledByEntry = 0x01,
  CustomContracts = 0x10,
  CustomGroups = 0x20,
  WitnessRules = 0x40,
  Global = 0x80
}

export function witnessScopeName(scope: WitnessScope): string {
  if (scope === WitnessScope.NONE) {
    return "None";
  }
  const flags: string[] = [];
  if (scope & WitnessScope.CalledByEntry) {
    flags.push("CalledByEntry");
  }
  if (scope & WitnessScope.CustomContracts) {
    flags.push("CustomContracts");
  }
  if (scope & WitnessScope.CustomGroups) {
    flags.push("CustomGroups");
  }
  if (scope & WitnessScope.WitnessRules) {
    flags.push("WitnessRules");
  }
  if (scope & WitnessScope.Global) {
    flags.push("Global");
  }
  return flags.join(",");
}

export class Witness {
  public constructor(
    public invocation: Uint8Array,
    public verification: Uint8Array
  ) {}

  public get invocationScript(): Uint8Array {
    return this.invocation;
  }

  public get verificationScript(): Uint8Array {
    return this.verification;
  }

  public marshalTo(writer: BinaryWriter): void {
    writer.writeVarBytes(this.invocation);
    writer.writeVarBytes(this.verification);
  }

  public static unmarshalFrom(reader: BinaryReader): Witness {
    return new Witness(reader.readVarBytes(), reader.readVarBytes());
  }

  public toJSON(): { invocation: string; verification: string } {
    return {
      invocation: bytesToBase64(this.invocation),
      verification: bytesToBase64(this.verification)
    };
  }

  public to_json(): { invocation: string; verification: string } {
    return this.toJSON();
  }

  public equals(other: Witness): boolean {
    return equalBytes(this.invocation, other.invocation) && equalBytes(this.verification, other.verification);
  }
}
