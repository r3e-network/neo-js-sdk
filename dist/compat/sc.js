import { bytesToHex, concatBytes } from "../internal/bytes.js";
import { H160, H256 } from "../core/hash.js";
import { PublicKey } from "../core/keypair.js";
import { CallFlags } from "../core/script.js";
import { OpCode } from "../core/opcode.js";
import { HexString } from "./hex-string.js";
import { ContractParam, ContractParamType } from "./contract-param.js";
import { sha256Bytes } from "./hashes.js";
function syscallCode(syscallName) {
    const hash = sha256Bytes(new TextEncoder().encode(syscallName));
    return hash[0] | (hash[1] << 8) | (hash[2] << 16) | (hash[3] << 24);
}
function bigintToFixedLE(value) {
    if (value >= -1n && value <= 16n) {
        return new Uint8Array();
    }
    const widths = [8, 16, 32, 64, 128, 256];
    for (const bits of widths) {
        const min = -(1n << BigInt(bits - 1));
        const max = (1n << BigInt(bits - 1)) - 1n;
        if (value < min || value > max) {
            continue;
        }
        const mod = 1n << BigInt(bits);
        let unsigned = value < 0n ? mod + value : value;
        const bytes = new Uint8Array(bits / 8);
        for (let index = 0; index < bytes.length; index += 1) {
            bytes[index] = Number(unsigned & 0xffn);
            unsigned >>= 8n;
        }
        return bytes;
    }
    throw new Error(`Number too long to be emitted: ${value.toString()}`);
}
export class ScriptBuilder {
    script = [];
    emit(opcode, operand = new Uint8Array()) {
        this.script.push(opcode, ...operand);
        return this;
    }
    emitBoolean(value) {
        return this.emit(value ? OpCode.PUSHT : OpCode.PUSHF);
    }
    emitNumber(value) {
        const bigintValue = BigInt(value);
        if (bigintValue >= -1n && bigintValue <= 16n) {
            return this.emit((OpCode.PUSHM1 + Number(bigintValue) + 1));
        }
        const payload = bigintToFixedLE(bigintValue);
        switch (payload.length) {
            case 1:
                return this.emit(OpCode.PUSHINT8, payload);
            case 2:
                return this.emit(OpCode.PUSHINT16, payload);
            case 4:
                return this.emit(OpCode.PUSHINT32, payload);
            case 8:
                return this.emit(OpCode.PUSHINT64, payload);
            case 16:
                return this.emit(OpCode.PUSHINT128, payload);
            case 32:
                return this.emit(OpCode.PUSHINT256, payload);
            default:
                throw new Error(`Unsupported integer width: ${payload.length}`);
        }
    }
    emitBytes(value) {
        if (value.length < 0x100) {
            return this.emit(OpCode.PUSHDATA1, concatBytes(Uint8Array.of(value.length), value));
        }
        if (value.length < 0x10000) {
            return this.emit(OpCode.PUSHDATA2, concatBytes(Uint8Array.of(value.length & 0xff, (value.length >> 8) & 0xff), value));
        }
        if (value.length < 0x100000000) {
            return this.emit(OpCode.PUSHDATA4, concatBytes(Uint8Array.of(value.length & 0xff, (value.length >> 8) & 0xff, (value.length >> 16) & 0xff, (value.length >> 24) & 0xff), value));
        }
        throw new Error("Data too big to emit");
    }
    emitString(value) {
        return this.emitBytes(new TextEncoder().encode(value));
    }
    emitHexString(value) {
        const hex = value instanceof HexString ? value : HexString.fromHex(value, true);
        return this.emitBytes(hex.toArrayBuffer(true));
    }
    emitPublicKey(value) {
        const hex = value instanceof HexString ? value.toBigEndian() : value;
        return this.emit(OpCode.PUSHDATA1, concatBytes(Uint8Array.of(33), HexString.fromHex(hex).toArrayBuffer()));
    }
    emitArray(items) {
        if (items.length === 0) {
            return this.emit(OpCode.NEWARRAY0);
        }
        for (const item of [...items].reverse()) {
            this.emitPush(item);
        }
        this.emitNumber(items.length);
        return this.emit(OpCode.PACK);
    }
    emitMap(items) {
        for (const item of items) {
            this.emitPush(item.value);
            this.emitPush(item.key);
        }
        this.emitPush(items.length);
        return this.emit(OpCode.PACKMAP);
    }
    emitContractParam(param) {
        switch (param.type) {
            case ContractParamType.Any:
                if (param.value === null) {
                    return this.emit(OpCode.PUSHNULL);
                }
                return this.emitHexString(String(param.value));
            case ContractParamType.String:
                return this.emitString(String(param.value));
            case ContractParamType.Boolean:
                return this.emitBoolean(Boolean(param.value));
            case ContractParamType.Integer:
                return this.emitNumber(String(param.value));
            case ContractParamType.ByteArray:
            case ContractParamType.Hash160:
            case ContractParamType.Hash256:
            case ContractParamType.Signature:
                return this.emitHexString(param.value);
            case ContractParamType.PublicKey:
                return this.emitPublicKey(param.value);
            case ContractParamType.Array:
                return this.emitArray(param.value);
            case ContractParamType.Map:
                return this.emitMap(param.value);
            case ContractParamType.Void:
                return this.emit(OpCode.PUSHNULL);
            default:
                throw new Error(`Unsupported ContractParam type: ${param.type}`);
        }
    }
    emitPush(value) {
        if (value === undefined) {
            return this.emitPush(false);
        }
        if (value === null) {
            return this.emitPush(false);
        }
        if (typeof value === "boolean") {
            return this.emitBoolean(value);
        }
        if (typeof value === "string") {
            return this.emitString(value);
        }
        if (typeof value === "number" || typeof value === "bigint") {
            return this.emitNumber(value);
        }
        if (Array.isArray(value)) {
            return this.emitArray(value);
        }
        if (value instanceof Uint8Array) {
            return this.emitBytes(value);
        }
        if (value instanceof HexString) {
            return this.emitHexString(value);
        }
        if (value instanceof ContractParam || (typeof value === "object" && value !== null && "type" in value)) {
            return this.emitContractParam(ContractParam.fromJson(value));
        }
        if (value instanceof H160 || value instanceof H256 || value instanceof PublicKey) {
            return this.emitBytes(value.toBytes());
        }
        throw new Error(`Unidentified object: ${String(value)}`);
    }
    emitSyscall(service, args = []) {
        for (const arg of [...args].reverse()) {
            this.emitPush(arg);
        }
        const code = typeof service === "number" ? service : syscallCode(service);
        return this.emit(OpCode.SYSCALL, Uint8Array.of(code & 0xff, (code >> 8) & 0xff, (code >> 16) & 0xff, (code >> 24) & 0xff));
    }
    emitContractCall(contractHash, operation, callFlags = CallFlags.All, args = []) {
        if (typeof contractHash === "object") {
            return this.emitContractCall(contractHash.scriptHash, contractHash.operation, contractHash.callFlags ?? CallFlags.All, contractHash.args ?? []);
        }
        if (!operation) {
            throw new Error("No operation found");
        }
        if (args.length === 0) {
            this.emit(OpCode.NEWARRAY0);
        }
        else {
            for (const arg of [...args].reverse()) {
                this.emitPush(arg);
            }
            this.emitNumber(args.length);
            this.emit(OpCode.PACK);
        }
        this.emitPush(callFlags);
        this.emitString(operation);
        this.emitHexString(HexString.fromHex(contractHash));
        return this.emitSyscall("System.Contract.Call");
    }
    appendScript(script) {
        this.script.push(...HexString.fromHex(script).toArrayBuffer());
        return this;
    }
    toBytes() {
        return Uint8Array.from(this.script);
    }
    build() {
        return this.toHex();
    }
    toHex() {
        return bytesToHex(this.toBytes());
    }
}
export function createScript(...scripts) {
    const builder = new ScriptBuilder();
    for (const script of scripts) {
        if (typeof script === "string") {
            builder.appendScript(script);
            continue;
        }
        builder.emitContractCall(script);
    }
    return builder.build();
}
