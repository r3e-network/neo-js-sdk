import { bytesToHex, concatBytes, toUint8Array, utf8ToBytes } from "../internal/bytes.js";
import { sha256Bytes } from "../compat/hashes.js";
import { H160, H256 } from "./hash.js";
import { serialize } from "./serializing.js";
import { PublicKey } from "./keypair.js";
import { OpCode } from "./opcode.js";
export var CallFlags;
(function (CallFlags) {
    CallFlags[CallFlags["NONE"] = 0] = "NONE";
    CallFlags[CallFlags["ReadStates"] = 1] = "ReadStates";
    CallFlags[CallFlags["WriteStates"] = 2] = "WriteStates";
    CallFlags[CallFlags["AllowCall"] = 4] = "AllowCall";
    CallFlags[CallFlags["AllowNotify"] = 8] = "AllowNotify";
    CallFlags[CallFlags["States"] = 3] = "States";
    CallFlags[CallFlags["ReadOnly"] = 5] = "ReadOnly";
    CallFlags[CallFlags["All"] = 15] = "All";
})(CallFlags || (CallFlags = {}));
export function syscallCode(syscallName) {
    const hash = sha256Bytes(utf8ToBytes(syscallName));
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
    throw new Error(`push too large integer: ${value.toString()}`);
}
export class ScriptBuilder {
    script = [];
    emit(opcode, operand = new Uint8Array()) {
        this.script.push(opcode, ...operand);
        return this;
    }
    emitPush(item) {
        if (item === null || item === undefined) {
            return this.emit(OpCode.PUSHNULL);
        }
        if (typeof item === "boolean") {
            return this.emit(item ? OpCode.PUSHT : OpCode.PUSHF);
        }
        if (typeof item === "number" || typeof item === "bigint") {
            return this.emitPushInt(BigInt(item));
        }
        if (typeof item === "string") {
            return this.emitPushBytes(utf8ToBytes(item));
        }
        if (Array.isArray(item)) {
            return this.emitPushArray(item);
        }
        if (item instanceof Uint8Array || item instanceof ArrayBuffer) {
            return this.emitPushBytes(toUint8Array(item));
        }
        if (item instanceof H160 || item instanceof H256 || item instanceof PublicKey) {
            return this.emitPushBytes(serialize(item));
        }
        if (typeof item === "object" && item && "marshalTo" in item) {
            return this.emitPushBytes(serialize(item));
        }
        throw new Error(`Unsupported push item: ${String(item)}`);
    }
    emitPushInt(value) {
        if (value >= -1n && value <= 16n) {
            return this.emit((OpCode.PUSHM1 + Number(value) + 1));
        }
        const payload = bigintToFixedLE(value);
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
    emitPushBytes(value) {
        const length = value.length;
        if (length < 0x100) {
            return this.emit(OpCode.PUSHDATA1, concatBytes(Uint8Array.of(length), value));
        }
        if (length < 0x10000) {
            return this.emit(OpCode.PUSHDATA2, concatBytes(Uint8Array.of(length & 0xff, (length >> 8) & 0xff), value));
        }
        if (length < 0x100000000) {
            return this.emit(OpCode.PUSHDATA4, concatBytes(Uint8Array.of(length & 0xff, (length >> 8) & 0xff, (length >> 16) & 0xff, (length >> 24) & 0xff), value));
        }
        throw new Error(`push too large bytes: ${length}`);
    }
    emitPushArray(items) {
        if (items.length === 0) {
            return this.emit(OpCode.NEWARRAY0);
        }
        for (const item of [...items].reverse()) {
            this.emitPush(item);
        }
        this.emitPushInt(BigInt(items.length));
        return this.emit(OpCode.PACK);
    }
    emitContractCall(contractHash, method, callFlags = CallFlags.NONE, args = []) {
        this.emitPushArray(args);
        this.emitPushInt(BigInt(callFlags));
        this.emitPush(method);
        this.emitPush(typeof contractHash === "string" ? new H160(contractHash) : contractHash);
        return this.emitSyscall("System.Contract.Call");
    }
    emitSyscall(syscall, args = []) {
        for (const arg of [...args].reverse()) {
            this.emitPush(arg);
        }
        this.emit(OpCode.SYSCALL);
        const code = typeof syscall === "number" ? syscall : syscallCode(syscall);
        this.script.push(code & 0xff, (code >> 8) & 0xff, (code >> 16) & 0xff, (code >> 24) & 0xff);
        return this;
    }
    toBytes() {
        return Uint8Array.from(this.script);
    }
    toHex() {
        return bytesToHex(this.toBytes());
    }
}
