import { H160 } from "./core/hash.js";

export const MAIN_NETWORK_ID = 860833102;
export const TEST_NETWORK_ID = 894710606;
export const ADDRESS_VERSION = 53;
export const NEO_CONTRACT_HASH = "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";
export const GAS_CONTRACT_HASH = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
export const STDLIB_CONTRACT_HASH = "0xacce6fd80d44e1796aa0c2c625e9e4e0ce39efc0";
export const CRYPTOLIB_CONTRACT_HASH = "0x726cb6e0cd8628a1350a611384688911ab75f51b";
export const LEDGER_CONTRACT_HASH = "0xda65b600f7124ce6c79950c1772a36403104f2be";
export const ORACLE_CONTRACT_HASH = "0xfe924b7cfe89ddd271abaf7210a80a7e11178758";
export const POLICY_CONTRACT_HASH = "0xcc5e4edd9f5f8dba8bb65734541df7a1c081c67b";
export const NOTARY_CONTRACT_HASH = "0xc1e14f19c3e60d0b9244d06dd7ba9b113135ec3b";
export const ROLE_MANAGEMENT_CONTRACT_HASH = "0x49cf4e5378ffcd4dec034fd98a174c5491e395e2";

function hashFactory(value: string): () => H160 {
  return () => new H160(value);
}

export function mainNetworkId(): number {
  return MAIN_NETWORK_ID;
}

export function testNetworkId(): number {
  return TEST_NETWORK_ID;
}

export function addressVersion(): number {
  return ADDRESS_VERSION;
}

export const neoContractHash = hashFactory(NEO_CONTRACT_HASH);
export const gasContractHash = hashFactory(GAS_CONTRACT_HASH);
export const stdlibContractHash = hashFactory(STDLIB_CONTRACT_HASH);
export const cryptolibContractHash = hashFactory(CRYPTOLIB_CONTRACT_HASH);
export const ledgerContractHash = hashFactory(LEDGER_CONTRACT_HASH);
export const oracleContractHash = hashFactory(ORACLE_CONTRACT_HASH);
export const policyContractHash = hashFactory(POLICY_CONTRACT_HASH);
export const notaryContractHash = hashFactory(NOTARY_CONTRACT_HASH);
export const roleManagementContractHash = hashFactory(ROLE_MANAGEMENT_CONTRACT_HASH);
