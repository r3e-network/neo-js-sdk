import { describe, expect, it } from "vitest";
import {
  H160,
  OpCode,
  PrivateKey,
  ScriptBuilder,
  Signer,
  Tx,
  WitnessScope,
  deserialize,
  serialize,
  testNetworkId,
  witnessScopeName
} from "../src/index.js";

describe("core serialization", () => {
  it("formats hash wrappers as Neo big-endian hex strings", () => {
    const hash160 = new H160("0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5");

    expect(hash160.toString()).toBe("0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5");
    expect(hash160.toBytes()).toHaveLength(20);
  });

  it("formats witness scope flag names like the Python SDK", () => {
    const scopes = WitnessScope.CalledByEntry | WitnessScope.WitnessRules;
    expect(witnessScopeName(scopes)).toBe("CalledByEntry,WitnessRules");
  });

  it("serializes and deserializes a signed transaction", () => {
    const privateKey = new PrivateKey(
      "f046222512e7258c62f56f5e9e624d08c8dc38f336a15f320b3501ec7e90d7c6"
    );
    const script = new ScriptBuilder().emit(OpCode.RET).toBytes();
    const tx = new Tx({
      nonce: 1,
      systemFee: 12n,
      networkFee: 23n,
      validUntilBlock: 56,
      script,
      signers: [
        new Signer({
          account: privateKey.publicKey().getScriptHash(),
          scopes: WitnessScope.CalledByEntry
        })
      ]
    });

    const witness = privateKey.signWitness(tx.getSignData(testNetworkId()));
    tx.witnesses = [witness];

    const data = serialize(tx);
    const decoded = deserialize(data, Tx);

    expect(decoded.nonce).toBe(1);
    expect(decoded.systemFee).toBe(12n);
    expect(decoded.networkFee).toBe(23n);
    expect(decoded.validUntilBlock).toBe(56);
    expect(Array.from(decoded.script)).toEqual(Array.from(script));
    expect(decoded.signers).toHaveLength(1);
    expect(decoded.signers[0].account.equals(privateKey.publicKey().getScriptHash())).toBe(true);
    expect(decoded.signers[0].scopes).toBe(WitnessScope.CalledByEntry);
    expect(decoded.witnesses).toHaveLength(1);
    expect(decoded.witnesses[0].equals(witness)).toBe(true);
    expect(decoded.attributes).toEqual([]);
  });
});
