import type { InvokeResult, RpcArrayStackItemJson, RpcMapStackEntryJson, RpcStackItemJson } from "./types.js";
export type StackItemParser<T = unknown> = (item: RpcStackItemJson) => T;
export type InvokeResultParser<T = unknown[]> = (result: InvokeResult) => T;
export declare function parseStackItemBoolean(item: RpcStackItemJson): boolean;
export declare function parseStackItemInteger(item: RpcStackItemJson): bigint;
export declare function parseStackItemBytes(item: RpcStackItemJson): Uint8Array;
export declare function parseStackItemUtf8(item: RpcStackItemJson): string;
export declare function parseStackItemArray(item: RpcStackItemJson): RpcArrayStackItemJson["value"];
export declare function parseStackItemStruct(item: RpcStackItemJson): RpcArrayStackItemJson["value"];
export declare function parseStackItemMap(item: RpcStackItemJson): RpcMapStackEntryJson[];
export declare function buildStackParser<TParsers extends readonly StackItemParser[]>(...parsers: TParsers): InvokeResultParser<{
    [K in keyof TParsers]: TParsers[K] extends StackItemParser<infer TResult> ? TResult : never;
}>;
export declare function parseInvokeStack<TParsers extends readonly StackItemParser[]>(result: InvokeResult, ...parsers: TParsers): {
    [K in keyof TParsers]: TParsers[K] extends StackItemParser<infer TResult> ? TResult : never;
};
