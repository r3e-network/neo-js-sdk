import { describe, expect, it } from "vitest";
import type {
  CancelTransactionResult,
  CloseWalletResult,
  DumpPrivKeyResult,
  FindStatesResult,
  FindStorageResult,
  GetApplicationLogResult,
  GetBlockHeaderVerboseResult,
  GetBlockHeaderCountResult,
  GetBlockVerboseResult,
  GetCandidatesResult,
  GetContractStateResult,
  GetConnectionCountResult,
  GetContractStateManifestAbiResult,
  GetContractStateManifestEventResult,
  GetContractStateManifestMethodResult,
  GetContractStateManifestParameterResult,
  GetContractStateNefMethodTokenResult,
  GetContractStateNefResult,
  GetNep11PropertyValueResult,
  GetNewAddressResult,
  GetNativeContractsResult,
  GetNep11BalancesResult,
  GetNep11PropertiesResult,
  GetNep11TransfersResult,
  GetNep17BalancesResult,
  GetNep17TransfersResult,
  GetPeersResult,
  GetProofResult,
  GetRawMemPoolResult,
  GetRawTransactionResult,
  GetStateResult,
  GetStateHeightResult,
  GetStorageResult,
  GetStateRootResult,
  GetUnclaimedGasResult,
  GetUnspentsResult,
  GetVersionResult,
  GetVersionHardforkResult,
  GetVersionRpcSettingsResult,
  GetWalletUnclaimedGasResult,
  ImportPrivKeyResult,
  InvokeContractVerifyResult,
  InvokeDiagnosticsInvocationTree,
  InvokeDiagnosticsResult,
  InvokeDiagnosticsStorageChange,
  InvokeResult,
  PendingSignatureContextItem,
  PendingSignatureResult,
  ListAddressResult,
  ListPluginsResult,
  NetworkFeeResult,
  OpenWalletResult,
  RelayTransactionResult,
  SendRawTransactionResult,
  SubmitBlockResult,
  TerminateSessionResult,
  TraverseIteratorResult,
  RpcAnyStackItemJson,
  RpcArrayStackItemJson,
  RpcBooleanStackItemJson,
  RpcBufferStackItemJson,
  RpcByteStringStackItemJson,
  RpcInteropInterfaceStackItemJson,
  RpcIntegerStackItemJson,
  RpcMapStackEntryJson,
  RpcMapStackItemJson,
  RpcPointerStackItemJson,
  RpcStackItemJson,
  RpcStructStackItemJson,
  ValidateAddressResult,
  WalletBalanceResult
} from "../src/index.js";
import type { RpcClient } from "../src/index.js";

type Assert<T extends true> = T;
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

type _GetBlockHeaderCount = Assert<IsEqual<ReturnType<RpcClient["getBlockHeaderCount"]>, Promise<GetBlockHeaderCountResult>>>;
type _GetConnectionCount = Assert<IsEqual<ReturnType<RpcClient["getConnectionCount"]>, Promise<GetConnectionCountResult>>>;
type _GetPeers = Assert<IsEqual<ReturnType<RpcClient["getPeers"]>, Promise<GetPeersResult>>>;
type _GetVersion = Assert<IsEqual<ReturnType<RpcClient["getVersion"]>, Promise<GetVersionResult>>>;
type _ListPlugins = Assert<IsEqual<ReturnType<RpcClient["listPlugins"]>, Promise<ListPluginsResult>>>;
type _ValidateAddress = Assert<IsEqual<ReturnType<RpcClient["validateAddress"]>, Promise<ValidateAddressResult>>>;
type _GetCandidates = Assert<IsEqual<ReturnType<RpcClient["getCandidates"]>, Promise<GetCandidatesResult>>>;
type _GetStateRoot = Assert<IsEqual<ReturnType<RpcClient["getStateRoot"]>, Promise<GetStateRootResult>>>;
type _GetApplicationLog = Assert<IsEqual<ReturnType<RpcClient["getApplicationLog"]>, Promise<GetApplicationLogResult>>>;
type _GetRawTransaction = Assert<IsEqual<ReturnType<RpcClient["getRawTransaction"]>, Promise<GetRawTransactionResult>>>;
type _InvokeFunction = Assert<IsEqual<ReturnType<RpcClient["invokeFunction"]>, Promise<InvokeResult>>>;
type _InvokeContractVerify = Assert<IsEqual<ReturnType<RpcClient["invokeContractVerify"]>, Promise<InvokeContractVerifyResult>>>;
type _SendRawTransaction = Assert<IsEqual<ReturnType<RpcClient["sendRawTransaction"]>, Promise<SendRawTransactionResult>>>;
type _GetWalletBalance = Assert<IsEqual<ReturnType<RpcClient["getWalletBalance"]>, Promise<WalletBalanceResult>>>;
type _ListAddress = Assert<IsEqual<ReturnType<RpcClient["listAddress"]>, Promise<ListAddressResult>>>;
type _GetContractState = Assert<IsEqual<ReturnType<RpcClient["getContractState"]>, Promise<GetContractStateResult>>>;
type _GetNativeContracts = Assert<IsEqual<ReturnType<RpcClient["getNativeContracts"]>, Promise<GetNativeContractsResult>>>;
type _GetNep11Balances = Assert<IsEqual<ReturnType<RpcClient["getNep11Balances"]>, Promise<GetNep11BalancesResult>>>;
type _GetNep11Properties = Assert<IsEqual<ReturnType<RpcClient["getNep11Properties"]>, Promise<GetNep11PropertiesResult>>>;
type _GetNep11Transfers = Assert<IsEqual<ReturnType<RpcClient["getNep11Transfers"]>, Promise<GetNep11TransfersResult>>>;
type _GetNep17Balances = Assert<IsEqual<ReturnType<RpcClient["getNep17Balances"]>, Promise<GetNep17BalancesResult>>>;
type _GetNep17Transfers = Assert<IsEqual<ReturnType<RpcClient["getNep17Transfers"]>, Promise<GetNep17TransfersResult>>>;
type _GetNextBlockValidators = Assert<IsEqual<ReturnType<RpcClient["getNextBlockValidators"]>, Promise<GetCandidatesResult>>>;
type _GetRawMemPool = Assert<IsEqual<ReturnType<RpcClient["getRawMemPool"]>, Promise<GetRawMemPoolResult>>>;
type _GetStateHeight = Assert<IsEqual<ReturnType<RpcClient["getStateHeight"]>, Promise<GetStateHeightResult>>>;
type _GetProof = Assert<IsEqual<ReturnType<RpcClient["getProof"]>, Promise<GetProofResult>>>;
type _VerifyProof = Assert<IsEqual<ReturnType<RpcClient["verifyProof"]>, Promise<GetProofResult>>>;
type _GetState = Assert<IsEqual<ReturnType<RpcClient["getState"]>, Promise<GetStateResult>>>;
type _GetStorage = Assert<IsEqual<ReturnType<RpcClient["getStorage"]>, Promise<GetStorageResult>>>;
type _FindStorage = Assert<IsEqual<ReturnType<RpcClient["findStorage"]>, Promise<FindStorageResult>>>;
type _FindStates = Assert<IsEqual<ReturnType<RpcClient["findStates"]>, Promise<FindStatesResult>>>;
type _GetUnclaimedGas = Assert<IsEqual<ReturnType<RpcClient["getUnclaimedGas"]>, Promise<GetUnclaimedGasResult>>>;
type _OpenWallet = Assert<IsEqual<ReturnType<RpcClient["openWallet"]>, Promise<OpenWalletResult>>>;
type _CloseWallet = Assert<IsEqual<ReturnType<RpcClient["closeWallet"]>, Promise<CloseWalletResult>>>;
type _DumpPrivKey = Assert<IsEqual<ReturnType<RpcClient["dumpPrivKey"]>, Promise<DumpPrivKeyResult>>>;
type _GetNewAddress = Assert<IsEqual<ReturnType<RpcClient["getNewAddress"]>, Promise<GetNewAddressResult>>>;
type _GetWalletUnclaimedGas = Assert<IsEqual<ReturnType<RpcClient["getWalletUnclaimedGas"]>, Promise<GetWalletUnclaimedGasResult>>>;
type _ImportPrivKey = Assert<IsEqual<ReturnType<RpcClient["importPrivKey"]>, Promise<ImportPrivKeyResult>>>;
type _InvokeScript = Assert<IsEqual<ReturnType<RpcClient["invokeScript"]>, Promise<InvokeResult>>>;
type _TraverseIterator = Assert<IsEqual<ReturnType<RpcClient["traverseIterator"]>, Promise<TraverseIteratorResult>>>;
type _TerminateSession = Assert<IsEqual<ReturnType<RpcClient["terminateSession"]>, Promise<TerminateSessionResult>>>;
type _SendFrom = Assert<IsEqual<ReturnType<RpcClient["sendFrom"]>, Promise<RelayTransactionResult>>>;
type _SendMany = Assert<IsEqual<ReturnType<RpcClient["sendMany"]>, Promise<RelayTransactionResult>>>;
type _SendToAddress = Assert<IsEqual<ReturnType<RpcClient["sendToAddress"]>, Promise<RelayTransactionResult>>>;
type _SubmitBlock = Assert<IsEqual<ReturnType<RpcClient["submitBlock"]>, Promise<SubmitBlockResult>>>;
type _CancelTx = Assert<IsEqual<ReturnType<RpcClient["cancelTx"]>, Promise<CancelTransactionResult>>>;
type _CancelTransaction = Assert<IsEqual<ReturnType<RpcClient["cancelTransaction"]>, Promise<CancelTransactionResult>>>;
type _CalculateNetworkFee = Assert<IsEqual<ReturnType<RpcClient["calculateNetworkFee"]>, Promise<NetworkFeeResult>>>;

type _ContractStateNef = Assert<IsEqual<GetContractStateResult["nef"], GetContractStateNefResult>>;
type _ContractStateNefToken = Assert<IsEqual<GetContractStateNefResult["tokens"][number], GetContractStateNefMethodTokenResult>>;
type _ContractStateManifestMethod = Assert<IsEqual<GetContractStateResult["manifest"]["abi"]["methods"][number], GetContractStateManifestMethodResult>>;
type _ContractStateManifestEvent = Assert<IsEqual<GetContractStateResult["manifest"]["abi"]["events"][number], GetContractStateManifestEventResult>>;
type _ContractStateManifestAbi = Assert<IsEqual<GetContractStateResult["manifest"]["abi"], GetContractStateManifestAbiResult>>;
type _ContractStateManifestParameter = Assert<IsEqual<GetContractStateManifestMethodResult["parameters"][number], GetContractStateManifestParameterResult>>;
type _GetVersionRpc = Assert<IsEqual<NonNullable<GetVersionResult["rpc"]>, GetVersionRpcSettingsResult>>;
type _GetVersionHardfork = Assert<IsEqual<NonNullable<GetVersionResult["protocol"]["hardforks"]>[number], GetVersionHardforkResult>>;
type _InvokeDiagnostics = Assert<IsEqual<NonNullable<InvokeResult["diagnostics"]>, InvokeDiagnosticsResult>>;
type _InvokeInvocationTree = Assert<IsEqual<InvokeDiagnosticsResult["invokedcontracts"], InvokeDiagnosticsInvocationTree>>;
type _InvokeStorageChange = Assert<IsEqual<InvokeDiagnosticsResult["storagechanges"][number], InvokeDiagnosticsStorageChange>>;
type _PendingSignature = Assert<IsEqual<NonNullable<InvokeResult["pendingsignature"]>, PendingSignatureResult>>;
type _PendingSignatureItem = Assert<IsEqual<PendingSignatureResult["items"][string], PendingSignatureContextItem>>;
type _Nep11Properties = Assert<IsEqual<GetNep11PropertiesResult[string], GetNep11PropertyValueResult>>;
type _SignerRules = Assert<IsEqual<NonNullable<GetRawTransactionResult["signers"][number]["rules"]>[number], ReturnType<import("../src/index.js").WitnessRule["toJSON"]>>>;
type _RawTxAttributes = Assert<IsEqual<GetRawTransactionResult["attributes"][number], ReturnType<import("../src/index.js").TxAttribute["toJSON"]>>>;
type _RelayTxAttributes = Assert<IsEqual<RelayTransactionResult["attributes"][number], ReturnType<import("../src/index.js").TxAttribute["toJSON"]>>>;
type _StackUnionBoolean = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Boolean" }>, RpcBooleanStackItemJson>>;
type _StackUnionInteger = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Integer" }>, RpcIntegerStackItemJson>>;
type _StackUnionByteString = Assert<IsEqual<Extract<RpcStackItemJson, { type: "ByteString" }>, RpcByteStringStackItemJson>>;
type _StackUnionBuffer = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Buffer" }>, RpcBufferStackItemJson>>;
type _StackUnionPointer = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Pointer" }>, RpcPointerStackItemJson>>;
type _StackUnionAny = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Any" }>, RpcAnyStackItemJson>>;
type _StackUnionArray = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Array" }>, RpcArrayStackItemJson>>;
type _StackUnionStruct = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Struct" }>, RpcStructStackItemJson>>;
type _StackUnionMap = Assert<IsEqual<Extract<RpcStackItemJson, { type: "Map" }>, RpcMapStackItemJson>>;
type _StackUnionInterop = Assert<IsEqual<Extract<RpcStackItemJson, { type: "InteropInterface" }>, RpcInteropInterfaceStackItemJson>>;
type _StackMapEntry = Assert<IsEqual<RpcMapStackItemJson["value"][number], RpcMapStackEntryJson>>;

const getBlockVerbose = (client: RpcClient) => client.getBlock("0x1", true);
const getBlockRaw = (client: RpcClient) => client.getBlock("0x1", false);
const getBlockHeaderVerbose = (client: RpcClient) => client.getBlockHeader("0x1", true);
const getBlockHeaderRaw = (client: RpcClient) => client.getBlockHeader("0x1", false);
type _GetBlockVerbose = Assert<IsEqual<ReturnType<typeof getBlockVerbose>, Promise<GetBlockVerboseResult>>>;
type _GetBlockRaw = Assert<IsEqual<ReturnType<typeof getBlockRaw>, Promise<string>>>;
type _GetBlockHeaderVerbose = Assert<IsEqual<ReturnType<typeof getBlockHeaderVerbose>, Promise<GetBlockHeaderVerboseResult>>>;
type _GetBlockHeaderRaw = Assert<IsEqual<ReturnType<typeof getBlockHeaderRaw>, Promise<string>>>;
type _GetUnspents = Assert<IsEqual<ReturnType<RpcClient["getUnspents"]>, Promise<GetUnspentsResult>>>;

describe("rpc client types", () => {
  it("exposes typed return values for core rpc methods", () => {
    expect(true).toBe(true);
  });

  it("exposes typed return values for extended rpc methods", () => {
    expect(true).toBe(true);
  });
});
