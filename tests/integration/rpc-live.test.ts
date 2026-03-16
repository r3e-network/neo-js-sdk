import { describe, expect, it } from "vitest";
import { RpcClient, testnet_endpoints } from "../../src/index.js";

const runLive = process.env.RUN_NEO_LIVE === "1";

describe.runIf(runLive)("live rpc smoke", () => {
  it("talks to a Neo testnet node and returns plausible data", async () => {
    const endpoint = process.env.NEO_RPC_URL ?? testnet_endpoints()[0];
    const client = new RpcClient(endpoint);

    const [blockCount, bestBlockHash, version, validation] = await Promise.all([
      client.getBlockCount(),
      client.getBestBlockHash(),
      client.getVersion(),
      client.validateAddress("NbTiM6h8r99kpRtb428XcsUk1TzKed2gTc")
    ]);

    expect(blockCount).toBeGreaterThan(0);
    expect(bestBlockHash).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(version.useragent.length).toBeGreaterThan(0);
    expect(version.protocol.network).toBeGreaterThan(0);
    expect(typeof validation).toBe("boolean");

    const blockHash = await client.getBlockHash(Math.max(0, blockCount - 1));
    const header = await client.getBlockHeader(blockHash, true);

    expect(blockHash).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(header.hash).toBe(blockHash);
    expect(header.index).toBeGreaterThanOrEqual(0);
  }, 30_000);
});
