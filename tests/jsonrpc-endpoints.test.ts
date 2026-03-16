import { describe, expect, it } from "vitest";
import { JsonRpc, JsonRpcError, RpcCode } from "../src/index.js";

describe("JsonRpc endpoints", () => {
  it("falls back to later endpoints when an earlier transport attempt fails", async () => {
    const seen: string[] = [];
    const jsonrpc = new JsonRpc(["http://one", "http://two"], {
      transport: async (url, request) => {
        seen.push(url);
        if (url === "http://one") {
          throw new Error("network down");
        }
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: "ok"
        };
      }
    });

    await expect(jsonrpc.send("ping")).resolves.toBe("ok");
    expect(seen).toEqual(["http://one", "http://two"]);
  });

  it("does not retry logical JsonRpc errors on another endpoint", async () => {
    const seen: string[] = [];
    const jsonrpc = new JsonRpc(["http://one", "http://two"], {
      transport: async (url, request) => {
        seen.push(url);
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: RpcCode.MethodNotFound,
            message: "missing"
          }
        };
      }
    });

    await expect(jsonrpc.send("missing")).rejects.toEqual(
      new JsonRpcError(RpcCode.MethodNotFound, "missing")
    );
    expect(seen).toEqual(["http://one"]);
  });

  it("rotates the starting endpoint between successful calls", async () => {
    const seen: string[] = [];
    const jsonrpc = new JsonRpc(["http://one", "http://two", "http://three"], {
      transport: async (url, request) => {
        seen.push(`${url}:${request.method}`);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: request.method
        };
      }
    });

    await jsonrpc.send("first");
    await jsonrpc.send("second");
    await jsonrpc.send("third");

    expect(seen).toEqual([
      "http://one:first",
      "http://two:second",
      "http://three:third"
    ]);
  });
});
