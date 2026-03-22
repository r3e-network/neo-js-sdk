import { describe, expect, it } from "vitest";
import { RpcClient, testnetEndpoints } from "../../src/index.js";

const runLive = process.env.RUN_NEO_LIVE === "1";

describe.runIf(runLive)("live rpc smoke", () => {
  it("talks to a Neo testnet node and returns plausible data", async () => {
    const explicitEndpoint = process.env.NEO_RPC_URL;
    const client = new RpcClient(explicitEndpoint ?? testnetEndpoints(), {
      endpointStrategy: "round-robin",
      retryTransportErrors: true
    });

    let blockCount: number;
    let bestBlockHash: string;
    let version: Awaited<ReturnType<typeof client.getVersion>>;
    let validation: Awaited<ReturnType<typeof client.validateAddress>>;

    try {
      [blockCount, bestBlockHash, version, validation] = await Promise.all([
        client.getBlockCount(),
        client.getBestBlockHash(),
        client.getVersion(),
        client.validateAddress({ address: "NbTiM6h8r99kpRtb428XcsUk1TzKed2gTc" })
      ]);
    } catch (error) {
      if (explicitEndpoint) {
        throw error;
      }
      console.warn(`Skipping live RPC smoke: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

    expect(blockCount).toBeGreaterThan(0);
    expect(bestBlockHash).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(version.useragent.length).toBeGreaterThan(0);
    expect(version.protocol.network).toBeGreaterThan(0);
    expect(validation.isvalid).toBe(true);

    const blockHash = await client.getBlockHash({ blockIndex: Math.max(0, blockCount - 1) });
    const header = await client.getBlockHeader({ indexOrHash: blockHash, verbose: true });

    expect(blockHash).toMatch(/^0x[0-9a-f]{64}$/i);
    expect(header.hash).toBe(blockHash);
    expect(header.index).toBeGreaterThanOrEqual(0);
  }, 30_000);
});
