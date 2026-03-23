/**
 * Reverse the byte order of a hex string
 */
export declare function reverseHex(hex: string): string;
/**
 * Convert UTF-8 string to hex string
 */
export declare function str2hexstring(str: string): string;
/**
 * Convert hex string to UTF-8 string
 */
export declare function hexstring2str(hex: string): string;
/**
 * Convert number to hex string
 */
export declare function num2hexstring(num: number, size?: number, littleEndian?: boolean): string;
/**
 * RIPEMD160(SHA256(data))
 */
export declare function hash160(hex: string): string;
