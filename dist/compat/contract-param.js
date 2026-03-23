import { getScriptHashFromAddress, isAddress, normalizePublicKey } from "./wallet-helpers.js";
import { HexString } from "./hex-string.js";
export var ContractParamType;
(function (ContractParamType) {
    ContractParamType[ContractParamType["Any"] = 0] = "Any";
    ContractParamType[ContractParamType["Boolean"] = 16] = "Boolean";
    ContractParamType[ContractParamType["Integer"] = 17] = "Integer";
    ContractParamType[ContractParamType["ByteArray"] = 18] = "ByteArray";
    ContractParamType[ContractParamType["String"] = 19] = "String";
    ContractParamType[ContractParamType["Hash160"] = 20] = "Hash160";
    ContractParamType[ContractParamType["Hash256"] = 21] = "Hash256";
    ContractParamType[ContractParamType["PublicKey"] = 22] = "PublicKey";
    ContractParamType[ContractParamType["Signature"] = 23] = "Signature";
    ContractParamType[ContractParamType["Array"] = 32] = "Array";
    ContractParamType[ContractParamType["Map"] = 34] = "Map";
    ContractParamType[ContractParamType["InteropInterface"] = 48] = "InteropInterface";
    ContractParamType[ContractParamType["Void"] = 255] = "Void";
})(ContractParamType || (ContractParamType = {}));
function parseType(value) {
    if (typeof value === "number") {
        return value;
    }
    const parsed = ContractParamType[value];
    if (parsed === undefined) {
        throw new Error(`unsupported ContractParam type: ${value}`);
    }
    return parsed;
}
function typeName(value) {
    return ContractParamType[value];
}
export class ContractParam {
    type;
    value;
    constructor(input) {
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
                    this.value = value.map((item) => ContractParam.fromJson(item));
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
    toJSON() {
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
                return { type: typeName(this.type), value: this.value.toBase64(true) };
            case ContractParamType.Hash160:
            case ContractParamType.Hash256:
            case ContractParamType.PublicKey:
            case ContractParamType.Signature:
                return { type: typeName(this.type), value: this.value.toBigEndian() };
            case ContractParamType.Array:
                return {
                    type: typeName(this.type),
                    value: this.value.map((item) => item.toJSON()),
                };
            case ContractParamType.Map:
                return {
                    type: typeName(this.type),
                    value: this.value.map((entry) => ({
                        key: entry.key.toJSON(),
                        value: entry.value.toJSON(),
                    })),
                };
            default:
                throw new Error("unsupported ContractParam");
        }
    }
    toJson() {
        return this.toJSON();
    }
    static any(value = null) {
        if (value instanceof HexString) {
            return new ContractParam({ type: ContractParamType.Any, value: value.toBigEndian() });
        }
        return new ContractParam({ type: ContractParamType.Any, value });
    }
    static boolean(value) {
        return new ContractParam({ type: ContractParamType.Boolean, value: !!value });
    }
    static integer(value) {
        if (typeof value === "string") {
            return new ContractParam({ type: ContractParamType.Integer, value: value.split(".")[0] });
        }
        return new ContractParam({ type: ContractParamType.Integer, value: BigInt(Math.trunc(Number(value))).toString() });
    }
    static string(value) {
        return new ContractParam({ type: ContractParamType.String, value });
    }
    static byteArray(value) {
        if (typeof value === "string") {
            return new ContractParam({ type: ContractParamType.ByteArray, value: HexString.fromBase64(value, true) });
        }
        return new ContractParam({ type: ContractParamType.ByteArray, value });
    }
    static hash160(value) {
        const hex = value instanceof HexString ? value : HexString.fromHex(isAddress(value) ? getScriptHashFromAddress(value) : value);
        if (hex.byteLength !== 20) {
            throw new Error(`hash160 expected 20 bytes but got ${hex.byteLength}`);
        }
        return new ContractParam({ type: ContractParamType.Hash160, value: hex });
    }
    static hash256(value) {
        const hex = value instanceof HexString ? value : HexString.fromHex(value);
        if (hex.byteLength !== 32) {
            throw new Error(`hash256 expected 32 bytes but got ${hex.byteLength}`);
        }
        return new ContractParam({ type: ContractParamType.Hash256, value: hex });
    }
    static publicKey(value) {
        const hex = value instanceof HexString ? value : HexString.fromHex(normalizePublicKey(value, true));
        return new ContractParam({ type: ContractParamType.PublicKey, value: hex });
    }
    static signature(value) {
        const hex = value instanceof HexString ? value : HexString.fromHex(value);
        if (hex.byteLength !== 64) {
            throw new Error(`signature expected 64 bytes but got ${hex.byteLength}`);
        }
        return new ContractParam({ type: ContractParamType.Signature, value: hex });
    }
    static array(...params) {
        return new ContractParam({
            type: ContractParamType.Array,
            value: params.map((param) => (param instanceof ContractParam ? param : ContractParam.fromJson(param))),
        });
    }
    static map(...params) {
        return new ContractParam({ type: ContractParamType.Map, value: params });
    }
    static void() {
        return new ContractParam({ type: ContractParamType.Void, value: null });
    }
    static fromJson(input) {
        if (input instanceof ContractParam) {
            return new ContractParam(input);
        }
        const type = parseType(input.type);
        const value = input.value;
        switch (type) {
            case ContractParamType.Any:
                return ContractParam.any(value);
            case ContractParamType.Boolean:
                return ContractParam.boolean(value);
            case ContractParamType.Integer:
                return ContractParam.integer(value);
            case ContractParamType.String:
                return ContractParam.string(String(value ?? ""));
            case ContractParamType.ByteArray:
                return ContractParam.byteArray(value);
            case ContractParamType.Hash160:
                return ContractParam.hash160(value);
            case ContractParamType.Hash256:
                return ContractParam.hash256(value);
            case ContractParamType.PublicKey:
                return ContractParam.publicKey(value);
            case ContractParamType.Signature:
                return ContractParam.signature(value);
            case ContractParamType.Array:
                return ContractParam.array(...(value ?? []));
            case ContractParamType.Map:
                return ContractParam.map(...(value ?? []));
            case ContractParamType.Void:
                return ContractParam.void();
            default:
                throw new Error(`unsupported ContractParam type: ${typeName(type)}`);
        }
    }
}
