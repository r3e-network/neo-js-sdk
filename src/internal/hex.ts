export function strip0x(value: string): string {
  return value.startsWith("0x") || value.startsWith("0X") ? value.slice(2) : value;
}

export function normalizeHex(value: string): string {
  const normalized = strip0x(value).toLowerCase();
  if (normalized.length % 2 !== 0) {
    throw new Error("Hex strings must have an even length");
  }
  return normalized;
}
