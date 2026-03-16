import { describe, expect, it } from "vitest";
import {
  Block,
  H160,
  H256,
  Header,
  TrimmedBlock,
  Tx,
  Witness,
  deserialize,
  serialize,
  testNetworkId
} from "../src/index.js";

describe("block models", () => {
  it("serializes and deserializes full and trimmed blocks", () => {
    const witness = new Witness(new Uint8Array([1, 2]), new Uint8Array([3, 4]));
    const header = new Header({
      version: 0,
      previousBlockHash: new H256(),
      merkleRoot: new H256(),
      unixMillis: 123,
      nonce: 456,
      index: 7,
      primaryIndex: 1,
      nextConsensus: new H160(),
      witness
    });
    const tx = new Tx({
      nonce: 1,
      systemFee: 1n,
      networkFee: 2n,
      validUntilBlock: 3,
      script: new Uint8Array([0x40]),
      signers: []
    });
    const block = new Block(header, [tx]);
    const trimmed = new TrimmedBlock(header, [new H256("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")]);

    const decodedBlock = deserialize(serialize(block), Block);
    const decodedTrimmed = deserialize(serialize(trimmed), TrimmedBlock);
    const signData = header.getSignData(testNetworkId());

    expect(decodedBlock.header.index).toBe(7);
    expect(decodedBlock.transactions).toHaveLength(1);
    expect(decodedTrimmed.transactions[0].toString()).toBe(
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    );
    expect(signData).toHaveLength(36);
    expect(Array.from(signData.slice(0, 4))).toEqual([0x4e, 0x33, 0x54, 0x35]);
    expect(block.toJSON().tx).toHaveLength(1);
    expect(trimmed.toJSON().tx).toEqual([
      "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    ]);
  });
});
