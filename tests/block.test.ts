import { describe, expect, it } from "vitest";
import {
  BinaryWriter,
  Block,
  H160,
  H256,
  Header,
  TrimmedBlock,
  Tx,
  Witness,
  WitnessScope,
  deserialize,
  serialize,
  testNetworkId,
  witnessScopeName,
} from "../src/index.js";

function makeHeader(overrides?: { primaryIndex?: number; unixMillis?: number }) {
  return new Header({
    version: 0,
    previousBlockHash: new H256(),
    merkleRoot: new H256(),
    unixMillis: overrides?.unixMillis ?? 123,
    nonce: 456,
    index: 7,
    primaryIndex: overrides?.primaryIndex ?? 1,
    nextConsensus: new H160(),
    witness: new Witness(new Uint8Array([1, 2]), new Uint8Array([3, 4])),
  });
}

describe("block models", () => {
  it("serializes and deserializes full and trimmed blocks", () => {
    const header = makeHeader();
    const tx = new Tx({
      nonce: 1, systemFee: 1n, networkFee: 2n, validUntilBlock: 3,
      script: new Uint8Array([0x40]), signers: [],
    });
    const txHash = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const block = new Block(header, [tx]);
    const trimmed = new TrimmedBlock(header, [new H256(txHash)]);

    const decodedBlock = deserialize(serialize(block), Block);
    const decodedTrimmed = deserialize(serialize(trimmed), TrimmedBlock);
    const signData = header.getSignData(testNetworkId());

    expect(decodedBlock.header.index).toBe(7);
    expect(decodedBlock.transactions).toHaveLength(1);
    expect(decodedTrimmed.transactions[0].toString()).toBe(txHash);
    expect(signData).toHaveLength(36);
    expect(Array.from(signData.slice(0, 4))).toEqual([0x4e, 0x33, 0x54, 0x35]);
    expect(block.toJSON().tx).toHaveLength(1);
    expect(trimmed.toJSON().tx).toEqual([txHash]);
  });

  it("covers witness getters and canonical json helpers", () => {
    const witness = new Witness(new Uint8Array([1, 2]), new Uint8Array([3, 4]));

    expect(witness.invocationScript).toEqual(new Uint8Array([1, 2]));
    expect(witness.verificationScript).toEqual(new Uint8Array([3, 4]));
    expect(witness.toJSON()).toEqual({ invocation: "AQI=", verification: "AwQ=" });
    expect(witnessScopeName(WitnessScope.None)).toBe("None");
    expect(witnessScopeName(WitnessScope.CustomContracts | WitnessScope.CustomGroups | WitnessScope.Global)).toBe(
      "CustomContracts,CustomGroups,Global",
    );
  });

  it("covers header time, marshal, and block/trimmed toBytes/toJSON", () => {
    const header = makeHeader({ primaryIndex: 4, unixMillis: 1 });
    const block = new Block(header, []);
    const trimmed = new TrimmedBlock(header, [new H256()]);

    expect(header.time).toBe(1n);
    expect(header.getSignData(894710606).length).toBeGreaterThan(0);

    const marshalWriter = new BinaryWriter();
    header.marshalUnsignedTo(marshalWriter);
    expect(marshalWriter.toBytes().length).toBeGreaterThan(0);

    expect(block.toBytes().length).toBeGreaterThan(0);
    expect(block.toJSON().tx).toEqual([]);
    expect(trimmed.toBytes().length).toBeGreaterThan(0);
    expect(trimmed.toJSON().tx).toHaveLength(1);
  });
});
