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

export class RPCClient extends RpcClient {}

export const wallet = {
  Account,
  Wallet,
  getAddressFromScriptHash,
  getScriptHashFromAddress,
  isAddress,
};

export const rpc = {
  RPCClient,
};

export const sc = {
  CallFlags,
  ContractParam,
  ScriptBuilder,
  createScript,
};

export const tx = {
  Transaction,
  Witness,
  WitnessScope,
};

export const u = {
  HexString,
  hash160,
  reverseHex,
};
