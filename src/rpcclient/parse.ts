import { base64ToBytes } from "../internal/bytes.js";
import type {
  InvokeResult,
  RpcArrayStackItemJson,
  RpcBooleanStackItemJson,
  RpcBufferStackItemJson,
  RpcByteStringStackItemJson,
  RpcIntegerStackItemJson,
  RpcMapStackEntryJson,
  RpcMapStackItemJson,
  RpcStackItemJson
} from "./types.js";

export type StackItemParser<T = unknown> = (item: RpcStackItemJson) => T;
export type InvokeResultParser<T = unknown[]> = (result: InvokeResult) => T;

function assertType<TType extends RpcStackItemJson["type"]>(
  item: RpcStackItemJson,
  expected: TType
): Extract<RpcStackItemJson, { type: TType }> {
  if (item.type !== expected) {
    throw new Error(`Expected stack item type ${expected} but got ${item.type}`);
  }
  return item as Extract<RpcStackItemJson, { type: TType }>;
}

export function parseStackItemBoolean(item: RpcStackItemJson): boolean {
  return assertType(item, "Boolean").value;
}

export function parseStackItemInteger(item: RpcStackItemJson): bigint {
  const value = assertType(item, "Integer").value;
  return BigInt(value);
}

export function parseStackItemBytes(item: RpcStackItemJson): Uint8Array {
  const typed = item.type === "ByteString"
    ? (item as RpcByteStringStackItemJson)
    : item.type === "Buffer"
      ? (item as RpcBufferStackItemJson)
      : null;
  if (typed === null) {
    throw new Error(`Expected stack item type ByteString or Buffer but got ${item.type}`);
  }
  return base64ToBytes(typed.value);
}

export function parseStackItemUtf8(item: RpcStackItemJson): string {
  return new TextDecoder().decode(parseStackItemBytes(item));
}

export function parseStackItemArray(item: RpcStackItemJson): RpcArrayStackItemJson["value"] {
  return assertType(item, "Array").value;
}

export function parseStackItemStruct(item: RpcStackItemJson): RpcArrayStackItemJson["value"] {
  return assertType(item, "Struct").value;
}

export function parseStackItemMap(item: RpcStackItemJson): RpcMapStackEntryJson[] {
  return assertType(item, "Map").value;
}

export function buildStackParser<TParsers extends readonly StackItemParser[]>(
  ...parsers: TParsers
): InvokeResultParser<{ [K in keyof TParsers]: TParsers[K] extends StackItemParser<infer TResult> ? TResult : never }> {
  return (result: InvokeResult) => {
    if (result.stack.length !== parsers.length) {
      throw new Error(`Wrong number of items to parse! Expected ${parsers.length} but got ${result.stack.length}!`);
    }
    return result.stack.map((item, index) => parsers[index](item)) as {
      [K in keyof TParsers]: TParsers[K] extends StackItemParser<infer TResult> ? TResult : never
    };
  };
}

export function parseInvokeStack<TParsers extends readonly StackItemParser[]>(
  result: InvokeResult,
  ...parsers: TParsers
): { [K in keyof TParsers]: TParsers[K] extends StackItemParser<infer TResult> ? TResult : never } {
  return buildStackParser(...parsers)(result);
}
