import { RpcClient } from "../rpcclient/index.js";
import { CallFlags } from "../core/script.js";
import { WitnessScope } from "../core/witness.js";
import { hash160, reverseHex } from "../utils.js";
import { ContractParam } from "./contract-param.js";
import { HexString } from "./hex-string.js";
import { createScript, ScriptBuilder } from "./sc.js";
import { Transaction, Witness } from "./tx.js";
import { Account, Wallet } from "../wallet/nep6-browser.js";
import { getAddressFromScriptHash, getScriptHashFromAddress, isAddress } from "./wallet-helpers.js";
export declare class RPCClient extends RpcClient {
}
export declare const wallet: {
    Account: typeof Account;
    Wallet: typeof Wallet;
    getAddressFromScriptHash: typeof getAddressFromScriptHash;
    getScriptHashFromAddress: typeof getScriptHashFromAddress;
    isAddress: typeof isAddress;
};
export declare const rpc: {
    RPCClient: typeof RPCClient;
};
export declare const sc: {
    CallFlags: typeof CallFlags;
    ContractParam: typeof ContractParam;
    ScriptBuilder: typeof ScriptBuilder;
    createScript: typeof createScript;
};
export declare const tx: {
    Transaction: typeof Transaction;
    Witness: typeof Witness;
    WitnessScope: typeof WitnessScope;
};
export declare const u: {
    HexString: typeof HexString;
    hash160: typeof hash160;
    reverseHex: typeof reverseHex;
};
