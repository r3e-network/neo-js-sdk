# neo-js-sdk

Neo N3 JavaScript/TypeScript SDK inspired by `r3e-network/neo-python-sdk` and extended with a broader typed RPC surface.

## What It Includes

- Neo N3 network constants and native contract hash helpers
- `H160` / `H256` hash wrappers
- Binary serialization helpers
- `PrivateKey`, `PublicKey`, `Witness`, `Signer`, `Tx`, `Header`, `Block`, `TrimmedBlock`
- `ScriptBuilder`, `OpCode`, `CallFlags`
- Async NEP-2 helpers and NEP-6 wallet/account models
- Typed JSON-RPC client with Python-parity methods plus broader official Neo N3 RPC coverage, including state-service methods like `getProof` / `getState` / `findStates` and wallet-node methods like `openWallet`, `sendFrom`, and `sendMany`

## Install

```bash
npm install neo-js-sdk
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
await client.sendTx(tx);

const invoke = await client.invokeFunction(
  gasContractHash(),
  "balanceOf",
  new InvokeParameters().addHash160(privateKey.publicKey().getScriptHash())
);
```

## Wallet Helpers

```ts
import { Wallet } from "neo-js-sdk";

const wallet = new Wallet({ name: "demo", passphrase: "secret" });
const account = await wallet.createAccount();

await wallet.writeToFile("./wallet.json");

const reopened = await Wallet.openNep6Wallet("./wallet.json");
await reopened.decrypt("secret");
```

## Development

```bash
npm test
npm run build
```
