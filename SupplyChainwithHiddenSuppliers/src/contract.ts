/**
 * Assembling the compiled supply-chain contract.
 *
 * The Compact toolchain emits `contracts/managed/supply-chain/contract/index.js`
 * plus ZK assets. This module loads that output and binds it to the
 * `companySecretKey` witness and the compiled-assets path so it can be handed
 * to `deployContract`/`Contract.execution` in the CLI.
 *
 * The contract's private state is empty (`null`): every circuit reads only the
 * public ledger, while supplier attributes live in the witness/inputs and are
 * turned into zero-knowledge proofs. Nothing about a supplier's identity,
 * certifications or prices is ever written to the ledger.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Contract as SCType, Witnesses as SCWitnesses } from '../contracts/managed/supply-chain/contract/index.js';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

export type SupplyChainContract = SCType<null, SCWitnesses<null>>;

/** Root of the compiled assets emitted by `npm run compile`. */
export const zkConfigPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'contracts',
  'managed',
  'supply-chain',
);

const contractModulePath = path.join(zkConfigPath, 'contract', 'index.js');

/**
 * Build a `CompiledContract` bound to the company authority key.
 *
 * `ownerKey` is the 32-byte authority key passed to the contract constructor;
 * it is also bound to the `companySecretKey` witness so the company can create
 * valid proofs. It is private witness data and never appears on the ledger.
 */
export async function buildContract(ownerKey: Uint8Array) {
  if (!fs.existsSync(contractModulePath)) {
    throw new Error(
      'Contract not compiled! Run: npm run compile',
    );
  }

  const { Contract } = await import(pathToFileURL(contractModulePath).href);

  const witnesses: SCWitnesses<null> = {
    companySecretKey: () => [null, ownerKey],
  };

  return CompiledContract.make<SupplyChainContract, null>('supply-chain', Contract).pipe(
    CompiledContract.withWitnesses(witnesses),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
}
