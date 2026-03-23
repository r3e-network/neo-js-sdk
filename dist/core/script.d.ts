import { H160 } from "./hash.js";
import { OpCode } from "./opcode.js";
export declare enum CallFlags {
    NONE = 0,
    ReadStates = 1,
    WriteStates = 2,
    AllowCall = 4,
    AllowNotify = 8,
    States = 3,
    ReadOnly = 5,
    All = 15
}
export declare function syscallCode(syscallName: string): number;
export declare class ScriptBuilder {
    private readonly script;
    emit(opcode: OpCode, operand?: Uint8Array): this;
    emitPush(item: unknown): this;
    private emitPushInt;
    private emitPushBytes;
    private emitPushArray;
    emitContractCall(contractHash: H160 | string, method: string, callFlags?: CallFlags, args?: unknown[]): this;
    emitSyscall(syscall: number | string, args?: unknown[]): this;
    toBytes(): Uint8Array;
    toHex(): string;
}
