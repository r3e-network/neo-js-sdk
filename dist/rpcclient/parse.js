import { base64ToBytes } from "../internal/bytes.js";
function assertType(item, expected) {
    if (item.type !== expected) {
        throw new Error(`Expected stack item type ${expected} but got ${item.type}`);
    }
    return item;
}
export function parseStackItemBoolean(item) {
    return assertType(item, "Boolean").value;
}
export function parseStackItemInteger(item) {
    const value = assertType(item, "Integer").value;
    return BigInt(value);
}
export function parseStackItemBytes(item) {
    const typed = item.type === "ByteString"
        ? item
        : item.type === "Buffer"
            ? item
            : null;
    if (typed === null) {
        throw new Error(`Expected stack item type ByteString or Buffer but got ${item.type}`);
    }
    return base64ToBytes(typed.value);
}
export function parseStackItemUtf8(item) {
    return new TextDecoder().decode(parseStackItemBytes(item));
}
export function parseStackItemArray(item) {
    return assertType(item, "Array").value;
}
export function parseStackItemStruct(item) {
    return assertType(item, "Struct").value;
}
export function parseStackItemMap(item) {
    return assertType(item, "Map").value;
}
export function buildStackParser(...parsers) {
    return (result) => {
        if (result.stack.length !== parsers.length) {
            throw new Error(`Wrong number of items to parse! Expected ${parsers.length} but got ${result.stack.length}!`);
        }
        return result.stack.map((item, index) => parsers[index](item));
    };
}
export function parseInvokeStack(result, ...parsers) {
    return buildStackParser(...parsers)(result);
}
