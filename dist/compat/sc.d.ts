import { CallFlags } from "../core/script.js";
import { OpCode } from "../core/opcode.js";
import { HexString } from "./hex-string.js";
import { ContractParam, type ContractParamJson } from "./contract-param.js";
export declare class ScriptBuilder {
    private readonly script;
    emit(opcode: OpCode, operand?: Uint8Array): this;
    emitBoolean(value: boolean): this;
    emitNumber(value: bigint | number | string): this;
    emitBytes(value: Uint8Array): this;
    emitString(value: string): this;
    emitHexString(value: HexString | string): this;
    emitPublicKey(value: HexString | string): this;
    emitArray(items: unknown[]): this;
    emitMap(items: Array<{
        key: ContractParam | ContractParamJson;
        value: ContractParam | ContractParamJson;
    }>): this;
    emitContractParam(param: ContractParam): this;
    emitPush(value: unknown): this;
    emitSyscall(service: number | string, args?: unknown[]): this;
    emitContractCall(contractHash: {
        scriptHash: string;
        operation: string;
        args?: unknown[];
        callFlags?: CallFlags;
    } | string, operation?: string, callFlags?: CallFlags, args?: unknown[]): this;
    appendScript(script: string): this;
    toBytes(): Uint8Array;
    build(): string;
    toHex(): string;
}
export declare function createScript(...scripts: Array<{
    scriptHash: string;
    operation: string;
    args?: unknown[];
    callFlags?: CallFlags;
} | string>): string;
