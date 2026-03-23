import { describe, expect, it } from "vitest";
import { Account } from "../../src/browser.js";
import {
  CallFlags,
  InvokeParameters,
  OpCode,
  PrivateKey,
  RpcClient,
  ScriptBuilder,
  Signer,
  Tx,
  WitnessScope,
  gasContractHash,
  parseStackItemInteger,
  parseStackItemUtf8,
  testNetworkId,
  testnetEndpoints
} from "../../src/index.js";

const runLiveWif = process.env.RUN_NEO_LIVE === "1" && !!process.env.NEO_TEST_WIF;

describe.runIf(runLiveWif)("live rpc with testnet wif", () => {
  it("validates key derivation, signing, and read-only rpc flows against testnet", async () => {
    const wif = process.env.NEO_TEST_WIF!;
    const privateKeyHex = Account.fromWIF(wif).privateKey;
    const privateKey = new PrivateKey(privateKeyHex);
    const publicKey = privateKey.publicKey();
    const address = publicKey.getAddress();

    const client = new RpcClient(process.env.NEO_RPC_URL ?? testnetEndpoints(), {
      endpointStrategy: "round-robin",
      retryTransportErrors: true
    });

    const [blockCount, bestBlockHash, version, isValidAddress] = await Promise.all([
      client.getBlockCount(),
      client.getBestBlockHash(),
      client.getVersion(),
      client.validateAddress({ address })
    ]);

    expect(blockCount).toBeGreaterThan(0);
    expect(bestBlockHash).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(version.protocol.network).toBe(testNetworkId());
    expect(isValidAddress.isvalid).toBe(true);

    const expectedAddress = Account.fromWIF(wif).address;
    expect(address).toBe(expectedAddress);

    const symbolResult = await client.invokeFunction({ contractHash: gasContractHash(), method: "symbol" });
    const decimalsResult = await client.invokeFunction({ contractHash: gasContractHash(), method: "decimals" });
    const balanceFunctionResult = await client.invokeFunction({
      contractHash: gasContractHash(),
      method: "balanceOf",
      args: new InvokeParameters().addHash160(publicKey.getScriptHash())
    });

    const balanceScript = new ScriptBuilder()
      .emitContractCall(gasContractHash(), "balanceOf", CallFlags.ReadOnly, [publicKey.getScriptHash()])
      .toBytes();
    const balanceScriptResult = await client.invokeScript({ script: balanceScript });

    expect(parseStackItemUtf8(symbolResult.stack[0])).toBe("GAS");
    expect(parseStackItemInteger(decimalsResult.stack[0])).toBe(8n);
    expect(parseStackItemInteger(balanceFunctionResult.stack[0])).toBe(
      parseStackItemInteger(balanceScriptResult.stack[0])
    );

    const tx = new Tx({
      nonce: 1,
      systemFee: 0n,
      networkFee: 0n,
      validUntilBlock: blockCount + 10,
      script: new ScriptBuilder().emit(OpCode.RET).toBytes(),
      signers: [
        new Signer({
          account: publicKey.getScriptHash(),
          scopes: WitnessScope.CalledByEntry
        })
      ]
    });

    const signData = tx.getSignData(version.protocol.network);
    const witness = privateKey.signWitness(signData);
    const signature = witness.invocationScript.slice(2);

    expect(signature).toHaveLength(64);
    expect(publicKey.verify(signData, signature)).toBe(true);
    expect(witness.verificationScript).toEqual(publicKey.getSignatureRedeemScript());
  }, 30_000);
});
