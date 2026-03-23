export type BytesLike = Uint8Array | ArrayBuffer | ArrayLike<number>;
export declare function toUint8Array(value: BytesLike): Uint8Array;
export declare function bytesToHex(value: BytesLike): string;
export declare function hexToBytes(value: string): Uint8Array;
export declare function bytesToBase64(value: BytesLike): string;
export declare function base64ToBytes(value: string): Uint8Array;
export declare function concatBytes(...values: BytesLike[]): Uint8Array;
export declare function reverseBytes(value: BytesLike): Uint8Array;
export declare function equalBytes(a: BytesLike, b: BytesLike): boolean;
export declare function utf8ToBytes(value: string): Uint8Array;
export declare function encodeUInt32LE(value: number): Uint8Array;
/**
 * Convert hex string to base64 string
 * Convenience function for common conversion pattern
 */
export declare function hex2base64(hex: string): string;
/**
 * Convert base64 string to hex string
 * Convenience function for common conversion pattern
 */
export declare function base642hex(base64: string): string;
