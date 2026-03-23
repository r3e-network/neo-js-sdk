import { getScriptHashFromAddress, isAddress, normalizePublicKey } from "./wallet-helpers.js";
import { HexString } from "./hex-string.js";

export enum ContractParamType {
  Any = 0,
  Boolean = 16,
  Integer = 17,
  ByteArray = 18,
  String = 19,
  Hash160 = 20,
  Hash256 = 21,
  PublicKey = 22,
  Signature = 23,
  Array = 32,
  Map = 34,
  InteropInterface = 48,
  Void = 255,
}

type ContractParamMapEntry = {
  key: ContractParam | ContractParamJson;
  value: ContractParam | ContractParamJson;
};

export type ContractParamJson = {
  type: keyof typeof ContractParamType | ContractParamType;
  value?: unknown;
};

function parseType(value: ContractParamType | keyof typeof ContractParamType): ContractParamType {
  if (typeof value === "number") {
    return value;
  }
  const parsed = ContractParamType[value];
  if (parsed === undefined) {
    throw new Error(`unsupported ContractParam type: ${value}`);
  }
  return parsed;
}

function typeName(value: ContractParamType): keyof typeof ContractParamType {
  return ContractParamType[value] as keyof typeof ContractParamType;
}

export class ContractParam {
  public readonly type: ContractParamType;
  public readonly value:
    | null
    | boolean
    | string
    | HexString
    | ContractParam[]
    | Array<{ key: ContractParam; value: ContractParam }>;

  public constructor(input: ContractParam | ContractParamJson) {
    if (input instanceof ContractParam) {
      this.type = input.type;
      this.value = input.value;
      return;
    }

    this.type = parseType(input.type);
    const value = input.value;

    switch (this.type) {
      case ContractParamType.Any:
        if (value === null || value === undefined || typeof value === "string") {
          this.value = value ?? null;
          return;
        }
        if (value instanceof HexString) {
          this.value = value.toBigEndian();
          return;
        }
        break;
      case ContractParamType.Boolean:
        if (typeof value === "boolean") {
          this.value = value;
          return;
        }
        break;
      case ContractParamType.Integer:
      case ContractParamType.String:
        if (typeof value === "string") {
          this.value = value;
          return;
        }
        break;
      case ContractParamType.ByteArray:
      case ContractParamType.Hash160:
      case ContractParamType.Hash256:
      case ContractParamType.PublicKey:
      case ContractParamType.Signature:
        if (value instanceof HexString) {
          this.value = value;
          return;
        }
        break;
      case ContractParamType.Array:
        if (Array.isArray(value)) {
          this.value = value.map((item) => ContractParam.fromJson(item as ContractParamJson));
          return;
        }
        break;
      case ContractParamType.Map:
        if (Array.isArray(value)) {
          this.value = value.map((item) => ({
            key: item.key instanceof ContractParam ? item.key : ContractParam.fromJson(item.key),
            value: item.value instanceof ContractParam ? item.value : ContractParam.fromJson(item.value),
          }));
          return;
        }
        break;
      case ContractParamType.Void:
        this.value = null;
        return;
      default:
        break;
    }

    throw new Error(`invalid value for ${typeName(this.type)}`);
  }

  public toJSON(): Record<string, unknown> {
    switch (this.type) {
      case ContractParamType.Any:
        return { type: typeName(this.type), value: this.value };
      case ContractParamType.Void:
        return { type: typeName(this.type), value: null };
      case ContractParamType.Boolean:
      case ContractParamType.Integer:
      case ContractParamType.String:
        return { type: typeName(this.type), value: this.value };
      case ContractParamType.ByteArray:
        return { type: typeName(this.type), value: (this.value as HexString).toBase64(true) };
      case ContractParamType.Hash160:
      case ContractParamType.Hash256:
      case ContractParamType.PublicKey:
      case ContractParamType.Signature:
        return { type: typeName(this.type), value: (this.value as HexString).toBigEndian() };
      case ContractParamType.Array:
        return {
          type: typeName(this.type),
          value: (this.value as ContractParam[]).map((item) => item.toJSON()),
        };
      case ContractParamType.Map:
        return {
          type: typeName(this.type),
          value: (this.value as Array<{ key: ContractParam; value: ContractParam }>).map((entry) => ({
            key: entry.key.toJSON(),
            value: entry.value.toJSON(),
          })),
        };
      default:
        throw new Error("unsupported ContractParam");
    }
  }

  public toJson(): Record<string, unknown> {
    return this.toJSON();
  }

  public static any(value: string | HexString | null = null): ContractParam {
    if (value instanceof HexString) {
      return new ContractParam({ type: ContractParamType.Any, value: value.toBigEndian() });
    }
    return new ContractParam({ type: ContractParamType.Any, value });
  }

  public static boolean(value: boolean | number | string): ContractParam {
    return new ContractParam({ type: ContractParamType.Boolean, value: !!value });
  }

  public static integer(value: bigint | number | string): ContractParam {
    if (typeof value === "string") {
      return new ContractParam({ type: ContractParamType.Integer, value: value.split(".")[0] });
    }
    return new ContractParam({ type: ContractParamType.Integer, value: BigInt(Math.trunc(Number(value))).toString() });
  }

  public static string(value: string): ContractParam {
    return new ContractParam({ type: ContractParamType.String, value });
  }

  public static byteArray(value: string | HexString): ContractParam {
    if (typeof value === "string") {
      return new ContractParam({ type: ContractParamType.ByteArray, value: HexString.fromBase64(value, true) });
    }
    return new ContractParam({ type: ContractParamType.ByteArray, value });
  }

  public static hash160(value: string | HexString): ContractParam {
    const hex = value instanceof HexString ? value : HexString.fromHex(isAddress(value) ? getScriptHashFromAddress(value) : value);
    if (hex.byteLength !== 20) {
      throw new Error(`hash160 expected 20 bytes but got ${hex.byteLength}`);
    }
    return new ContractParam({ type: ContractParamType.Hash160, value: hex });
  }

  public static hash256(value: string | HexString): ContractParam {
    const hex = value instanceof HexString ? value : HexString.fromHex(value);
    if (hex.byteLength !== 32) {
      throw new Error(`hash256 expected 32 bytes but got ${hex.byteLength}`);
    }
    return new ContractParam({ type: ContractParamType.Hash256, value: hex });
  }

  public static publicKey(value: string | HexString): ContractParam {
    const hex = value instanceof HexString ? value : HexString.fromHex(normalizePublicKey(value, true));
    return new ContractParam({ type: ContractParamType.PublicKey, value: hex });
  }

  public static signature(value: string | HexString): ContractParam {
    const hex = value instanceof HexString ? value : HexString.fromHex(value);
    if (hex.byteLength !== 64) {
      throw new Error(`signature expected 64 bytes but got ${hex.byteLength}`);
    }
    return new ContractParam({ type: ContractParamType.Signature, value: hex });
  }

  public static array(...params: Array<ContractParam | ContractParamJson>): ContractParam {
    return new ContractParam({
      type: ContractParamType.Array,
      value: params.map((param) => (param instanceof ContractParam ? param : ContractParam.fromJson(param))),
    });
  }

  public static map(...params: ContractParamMapEntry[]): ContractParam {
    return new ContractParam({ type: ContractParamType.Map, value: params });
  }

  public static void(): ContractParam {
    return new ContractParam({ type: ContractParamType.Void, value: null });
  }

  public static fromJson(input: ContractParam | ContractParamJson): ContractParam {
    if (input instanceof ContractParam) {
      return new ContractParam(input);
    }

    const type = parseType(input.type);
    const value = input.value;

    switch (type) {
      case ContractParamType.Any:
        return ContractParam.any(value as string | null);
      case ContractParamType.Boolean:
        return ContractParam.boolean(value as boolean | number | string);
      case ContractParamType.Integer:
        return ContractParam.integer(value as bigint | number | string);
      case ContractParamType.String:
        return ContractParam.string(String(value ?? ""));
      case ContractParamType.ByteArray:
        return ContractParam.byteArray(value as string | HexString);
      case ContractParamType.Hash160:
        return ContractParam.hash160(value as string | HexString);
      case ContractParamType.Hash256:
        return ContractParam.hash256(value as string | HexString);
      case ContractParamType.PublicKey:
        return ContractParam.publicKey(value as string | HexString);
      case ContractParamType.Signature:
        return ContractParam.signature(value as string | HexString);
      case ContractParamType.Array:
        return ContractParam.array(...((value as Array<ContractParam | ContractParamJson>) ?? []));
      case ContractParamType.Map:
        return ContractParam.map(...((value as ContractParamMapEntry[]) ?? []));
      case ContractParamType.Void:
        return ContractParam.void();
      default:
        throw new Error(`unsupported ContractParam type: ${typeName(type)}`);
    }
  }
}
