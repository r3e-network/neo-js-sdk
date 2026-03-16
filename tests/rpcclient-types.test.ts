import { describe, expectTypeOf, it } from "vitest";
import type {
  GetApplicationLogResult,
  GetBlockHeaderCountResult,
  GetCandidatesResult,
  GetConnectionCountResult,
  GetPeersResult,
  GetRawTransactionResult,
  GetStateRootResult,
  GetVersionResult,
  InvokeContractVerifyResult,
  InvokeResult,
  ListAddressResult,
  ListPluginsResult,
  SendRawTransactionResult,
  ValidateAddressResult,
  WalletBalanceResult
} from "../src/index.js";
import type { RpcClient } from "../src/index.js";

describe("rpc client types", () => {
  it("exposes typed return values for core rpc methods", () => {
    expectTypeOf<ReturnType<RpcClient["getBlockHeaderCount"]>>().toEqualTypeOf<Promise<GetBlockHeaderCountResult>>();
    expectTypeOf<ReturnType<RpcClient["getConnectionCount"]>>().toEqualTypeOf<Promise<GetConnectionCountResult>>();
    expectTypeOf<ReturnType<RpcClient["getPeers"]>>().toEqualTypeOf<Promise<GetPeersResult>>();
    expectTypeOf<ReturnType<RpcClient["getVersion"]>>().toEqualTypeOf<Promise<GetVersionResult>>();
    expectTypeOf<ReturnType<RpcClient["listPlugins"]>>().toEqualTypeOf<Promise<ListPluginsResult>>();
    expectTypeOf<ReturnType<RpcClient["validateAddress"]>>().toEqualTypeOf<Promise<ValidateAddressResult>>();
    expectTypeOf<ReturnType<RpcClient["getCandidates"]>>().toEqualTypeOf<Promise<GetCandidatesResult>>();
    expectTypeOf<ReturnType<RpcClient["getStateRoot"]>>().toEqualTypeOf<Promise<GetStateRootResult>>();
    expectTypeOf<ReturnType<RpcClient["getApplicationLog"]>>().toEqualTypeOf<Promise<GetApplicationLogResult>>();
    expectTypeOf<ReturnType<RpcClient["getRawTransaction"]>>().toEqualTypeOf<Promise<GetRawTransactionResult>>();
    expectTypeOf<ReturnType<RpcClient["invokeFunction"]>>().toEqualTypeOf<Promise<InvokeResult>>();
    expectTypeOf<ReturnType<RpcClient["invokeContractVerify"]>>().toEqualTypeOf<Promise<InvokeContractVerifyResult>>();
    expectTypeOf<ReturnType<RpcClient["sendRawTransaction"]>>().toEqualTypeOf<Promise<SendRawTransactionResult>>();
    expectTypeOf<ReturnType<RpcClient["getWalletBalance"]>>().toEqualTypeOf<Promise<WalletBalanceResult>>();
    expectTypeOf<ReturnType<RpcClient["listAddress"]>>().toEqualTypeOf<Promise<ListAddressResult>>();
  });
});
