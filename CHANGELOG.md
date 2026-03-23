# Changelog

## [0.3.6] - 2026-03-23

### Changed

- Removed the runtime dependency on `@cityofzion/neon-core`
- Replaced browser compatibility helpers with native SDK implementations for `wallet`, `rpc`, `sc`, `tx`, and `u`
- Added browser-compatible `Account.sign()` and `Account.fromWIF()` support used by Neo Explorer

## [0.3.5] - 2026-03-23

### Added

- Re-exported `wallet`, `rpc`, `sc`, `tx`, and `u` compatibility namespaces from `@cityofzion/neon-core` so legacy browser consumers can use `neonJs.*`-style imports through `@r3e/neo-js-sdk`

## [0.3.4] - 2026-03-23

### Fixed

- Added a browser-conditioned package entry so bundlers can consume the SDK without pulling `node:fs` into client builds

### Changed

- Aligned package metadata and README examples with the scoped package name `@r3e/neo-js-sdk`

## [0.3.3] - 2026-03-22

### Added

- Convenience functions for common conversion patterns:
  - `hex2base64()` - Convert hex string to base64 (combines hexToBytes + bytesToBase64)
  - `base642hex()` - Convert base64 to hex string (combines base64ToBytes + bytesToHex)

## [0.3.2] - 2026-03-22

### Fixed

- Rebuilt package to ensure `Tx.unmarshalUnsignedFrom()` is properly included in published distribution

## [0.3.1] - 2026-03-22

### Fixed

- Fixed `BinaryReader.readUInt64LE()` byte order bug that was reading bytes in reverse order
- Added `Tx.unmarshalUnsignedFrom()` method to properly deserialize unsigned transactions (without witnesses)

### Changed

- `Tx.unmarshalFrom()` now correctly reads signed transactions (with witnesses)
- Use `Tx.unmarshalUnsignedFrom()` for unsigned transaction hex (e.g., from governance proposals)

## [0.3.0] - 2026-03-22

### Added

- Exported additional byte utilities: `base64ToBytes`, `reverseBytes`, `utf8ToBytes`
- New utility functions for neon-js compatibility:
  - `reverseHex()` - Reverse byte order of hex strings
  - `str2hexstring()` - Convert UTF-8 string to hex
  - `hexstring2str()` - Convert hex to UTF-8 string
  - `num2hexstring()` - Convert number to hex with endianness support
  - `hash160()` - RIPEMD160(SHA256(data)) for address generation

### Changed

- Package name changed to `@r3e/neo-js-sdk` for scoped publishing

## [0.2.3] - 2026-03-22

Previous release with 90%+ test coverage and comprehensive Neo N3 support.
