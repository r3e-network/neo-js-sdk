# neo-js-sdk

Neo N3 JavaScript/TypeScript SDK with a typed RPC client, core transaction primitives, and NEP-2 / NEP-6 wallet helpers.

## What It Includes

- Neo N3 network constants and native contract hash helpers
- `H160` / `H256` hash wrappers
- Binary serialization helpers
- `PrivateKey`, `PublicKey`, `Witness`, `Signer`, `Tx`, `Header`, `Block`, `TrimmedBlock`
- `ScriptBuilder`, `OpCode`, `CallFlags`
- NEP-2 helpers and NEP-6 wallet/account models
- Typed JSON-RPC coverage across core, state-service, and wallet-node methods with modeled outputs and object-based inputs
- A single canonical `camelCase` API surface for JavaScript and TypeScript consumers

## Install

```bash
npm install neo-js-sdk
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Optional live RPC smoke test against Neo testnet:

```bash
npm run test:integration
```

Override the default testnet endpoint if needed:

```bash
NEO_RPC_URL=https://your-rpc-node npm run test:integration
```

## Usage

```ts
import {
  CallFlags,
  InvokeParameters,
  PrivateKey,
  RpcClient,
  ScriptBuilder,
  Signer,
  Tx,
  WitnessScope,
  gasContractHash,
  testNetworkId
} from "neo-js-sdk";

const privateKey = new PrivateKey(
  "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
);

const script = new ScriptBuilder()
  .emitContractCall(gasContractHash(), "transfer", CallFlags.All, [
    "from",
    "to",
    1
  ])
  .toBytes();

const tx = new Tx({
  nonce: 1,
  systemFee: 1_0000000n,
  networkFee: 1_0000000n,
  validUntilBlock: 100,
  script,
  signers: [
    new Signer({
      account: privateKey.publicKey().getScriptHash(),
      scopes: WitnessScope.CalledByEntry
    })
  ]
});

tx.witnesses = [privateKey.signWitness(tx.getSignData(testNetworkId()))];

const client = new RpcClient("https://seed1t5.neo.org:20332");
await client.sendRawTransaction({ tx });

const invoke = await client.invokeFunction({
  contractHash: gasContractHash(),
  method: "balanceOf",
  args: new InvokeParameters().addHash160(privateKey.publicKey().getScriptHash())
});
```

## Wallet Helpers

```ts
import { Wallet } from "neo-js-sdk";

const wallet = new Wallet({ name: "demo", passphrase: "secret" });
const account = wallet.createAccount();

wallet.writeToFile("./wallet.json");

const reopened = Wallet.openNep6Wallet("./wallet.json");
reopened.decrypt("secret");
```

## Development

```bash
npm run typecheck
npm test
npm run build
npm run test:integration
```
