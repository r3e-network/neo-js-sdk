# Neo N3 JS SDK Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Neo N3 JavaScript/TypeScript SDK under this repository that mirrors the useful surface of `r3e-network/neo-python-sdk` while extending RPC coverage to the current Neo N3 JSON-RPC surface.

**Architecture:** Create a standalone TypeScript package that exports Python-inspired classes (`H160`, `PrivateKey`, `Tx`, `Wallet`, `RpcClient`) and small wrappers around proven `@cityofzion/neon-core` primitives where appropriate. Keep binary serialization, wallet models, and RPC transport in-repo so the public API is cohesive and testable. Use unit tests first for every module and keep live-network behavior optional.

**Tech Stack:** TypeScript, Node.js, Vitest, `@cityofzion/neon-core`

### Task 1: Package Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/index.ts`
- Create: `src/constants.ts`
- Create: `src/internal/bytes.ts`
- Create: `src/internal/hex.ts`

**Step 1: Write the failing test**

Create `tests/package.test.ts` asserting the package root exports network constants and helper factories:

```ts
import { describe, expect, it } from "vitest";
import { mainNetworkId, testNetworkId, addressVersion } from "../src";

describe("package exports", () => {
  it("exports Neo N3 network constants", () => {
    expect(mainNetworkId()).toBe(860833102);
    expect(testNetworkId()).toBe(894710606);
    expect(addressVersion()).toBe(53);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/package.test.ts`
Expected: FAIL because package files do not exist yet.

**Step 3: Write minimal implementation**

Add package scaffold, TypeScript config, test runner config, and minimal `src/index.ts` plus `src/constants.ts` exports.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/package.test.ts`
Expected: PASS

### Task 2: Core Primitives And Serialization

**Files:**
- Create: `src/core/hash.ts`
- Create: `src/core/serializing.ts`
- Create: `src/core/keypair.ts`
- Create: `src/core/script.ts`
- Create: `src/core/opcode.ts`
- Create: `src/core/witness.ts`
- Create: `src/core/witness-rule.ts`
- Create: `src/core/tx.ts`
- Create: `src/core/block.ts`
- Modify: `src/index.ts`
- Test: `tests/serializing.test.ts`
- Test: `tests/script.test.ts`

**Step 1: Write the failing tests**

Port the Python test vectors and expected behaviors:
- transaction serialize/deserialize round-trip
- `WitnessScope` and related enum string formatting
- `ScriptBuilder.emitContractCall()` producing deterministic bytes
- `PrivateKey.signWitness()` creating invocation and verification scripts

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/serializing.test.ts tests/script.test.ts`
Expected: FAIL because the primitives do not exist yet.

**Step 3: Write minimal implementation**

Implement:
- `H160` / `H256` big-endian wrappers
- `BinaryReader` / `BinaryWriter`, `serialize()`, `deserialize()`
- `PrivateKey` / `PublicKey` wrappers backed by `neon-core`
- `ScriptBuilder`, `CallFlags`, `OpCode`
- `Witness`, `WitnessScope`
- witness rule/condition hierarchy
- `Signer`, transaction attributes, `Tx`
- `Header`, `Block`, `TrimmedBlock`

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/serializing.test.ts tests/script.test.ts`
Expected: PASS

### Task 3: Wallet Layer

**Files:**
- Create: `src/wallet/index.ts`
- Create: `src/wallet/nep2.ts`
- Create: `src/wallet/nep6.ts`
- Modify: `src/index.ts`
- Test: `tests/nep2.test.ts`
- Test: `tests/nep6.test.ts`

**Step 1: Write the failing tests**

Port the Python wallet tests and add JS-specific coverage:
- NEP-2 decrypt/encrypt known vector round-trip
- `Wallet.createAccount()` appends a signable account
- `Wallet.writeToFile()` writes valid NEP-6 JSON
- `Wallet.openNep6Wallet()` and `Wallet.decrypt()` hydrate signable accounts

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/nep2.test.ts tests/nep6.test.ts`
Expected: FAIL because wallet modules do not exist yet.

**Step 3: Write minimal implementation**

Implement:
- `ScryptParams`
- `encryptSecp256r1Key()` / `decryptSecp256r1Key()`
- `Parameter`, `Contract`, `Account`, `Wallet`
- file helpers for NEP-6 read/write

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/nep2.test.ts tests/nep6.test.ts`
Expected: PASS

### Task 4: RPC Client And Full Neo N3 Coverage

**Files:**
- Create: `src/rpcclient/types.ts`
- Create: `src/rpcclient/index.ts`
- Modify: `src/index.ts`
- Test: `tests/rpcclient.test.ts`
- Test: `tests/rpc-method-coverage.test.ts`

**Step 1: Write the failing tests**

Create tests for:
- Python parity methods: `getBestBlockHash`, `getBlockCount`, `getBlockHeaderCount`, `getBlockHash`, `getBlockHeader`, `invokeFunction`, `sendTx`, `getConnectionCount`, `getPeers`, `getVersion`, `submitBlock`, `listPlugins`, `validateAddress`, `cancelTx`
- Extended Neo N3 methods absent from Python and partially absent from `neon-js`: `getBlock`, `getApplicationLog`, `getRawTransaction`, `invokeScript`, `traverseIterator`, `findStorage`, `getContractState`, `getNativeContracts`, `getStateHeight`, `getUnspents`, `getRawMemPool`, `getTransactionHeight`, `getCommittee`, `getNextBlockValidators`, `getNep11Balances`, `getNep11Properties`, `getNep11Transfers`, `getNep17Balances`, `getNep17Transfers`, `getUnclaimedGas`, `calculateNetworkFee`
- request shape tests using a fake transport so every method proves its RPC name and params

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/rpcclient.test.ts tests/rpc-method-coverage.test.ts`
Expected: FAIL because `RpcClient` does not exist yet.

**Step 3: Write minimal implementation**

Implement:
- `RpcCode`, `JsonRpcError`, `JsonRpcTransport`, `JsonRpc`
- `InvokeParameters`
- endpoint helpers for mainnet/testnet
- `RpcClient.send()` and explicit typed methods for the covered Neo N3 RPC surface
- tx/block helpers that base64-encode serialized payloads where required

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/rpcclient.test.ts tests/rpc-method-coverage.test.ts`
Expected: PASS

### Task 5: Documentation, Example, And Final Verification

**Files:**
- Create: `README.md`
- Create: `tests/package.test.ts`
- Modify: `src/index.ts`

**Step 1: Write the failing test**

Add package-level smoke tests that import the public root and exercise the intended user flow:
- build a transfer script
- construct/sign a transaction
- serialize wallet data
- instantiate `RpcClient`

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/package.test.ts`
Expected: FAIL until final exports and examples are wired up.

**Step 3: Write minimal implementation**

Add:
- root exports for all public modules
- README usage examples matching the Python SDK flow but in JS/TS
- short notes about supported RPC coverage and transport injection for tests

**Step 4: Run full verification**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: PASS

Run: `npm pack --dry-run`
Expected: PASS with expected package contents
