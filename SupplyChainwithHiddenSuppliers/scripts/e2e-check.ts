/**
 * End-to-end smoke check for Supply Chain with Hidden Suppliers.
 *
 * Connects to the deployed contract with the real wallet, runs all four
 * circuits (register → recertify → proveFairPricing → withdrawClaim), reads
 * the public ledger back through the indexer at each step, and exits 0 on
 * success. Used by `npm run test:e2e`.
 *
 * The supplier records passed to the circuits are PRIVATE witness data — they
 * are only ever used to build proofs, never logged.
 */
import { WebSocket } from 'ws';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

import { resolveNetwork, getOrCreateSeed, getDeployment } from '../src/network';
import { createWallet, persistWalletState } from '../src/wallet';
import { deriveOwnerKey } from '../src/keys';
import { buildContract } from '../src/contract';
import { createProviders } from '../src/providers';
import { buildSuppliers } from '../src/suppliers';

// @ts-expect-error wallet sync requires WebSocket
globalThis.WebSocket = WebSocket;

// Must match the privateStateId used at deploy time.
const PRIVATE_STATE_ID = 'supplyChainPrivateState';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

function fail(msg: string): never {
  console.error(`❌ e2e-check failed: ${msg}`);
  process.exit(1);
}

function isHexAddress(s: unknown): s is string {
  return typeof s === 'string' && /^[0-9a-fA-F]+$/.test(s) && s.length >= 32;
}

async function main() {
  // 1. Deployment sanity
  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run: npm run setup -- --network ${network}`);
    process.exit(1);
  }
  if (!isHexAddress(deployment.address)) {
    fail(`Deployment address missing or invalid: ${JSON.stringify(deployment, null, 2)}`);
  }
  console.log(`✓ Deployment on file: ${deployment.address} (${network})`);

  // 2. Wallet + providers
  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  console.log('✓ Wallet created');

  const state = await walletCtx.wallet.waitForSyncedState();
  console.log('✓ Wallet synced');

  const providers = await createProviders({ networkConfig, walletCtx, privateStateStoreName: 'supply-chain-state' });

  // 3. Connect to the deployed contract
  const ownerKey = deriveOwnerKey(SEED);
  const compiledContract = await buildContract(ownerKey);
  const deployed: any = await findDeployedContract(providers, {
    compiledContract: compiledContract as any,
    contractAddress: deployment.address,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
  });
  console.log('✓ Connected to contract');

  // 4. Read ledger through the indexer
  const readLedger = async () => {
    const contractState = await providers.publicDataProvider.queryContractState(deployment.address);
    if (!contractState) return null;
    const module = await import('../contracts/managed/supply-chain/contract/index.js');
    return module.ledger(contractState.data);
  };

  const productId = `e2e-${Date.now()}`;
  const suppliers = buildSuppliers({
    certified: true,
    ethical: true,
    routes: true,
    certExpiry: 2100n * 365n * 24n * 3600n,
    pricePaid: 120n,
  });

  // 5. registerProduct
  console.log(`Registering product ${productId}...`);
  await deployed.callTx.registerProduct(productId, suppliers);
  console.log('✓ registerProduct completed');

  let ledger = await readLedger();
  let record = ledger?.products.lookup(productId);
  if (!record) fail(`Product ${productId} not found on the ledger after register`);
  if (!record.allCertified || !record.isEthical || !record.allRoutesCompliant) {
    fail(`Registered product claims incorrect: ${JSON.stringify(record)}`);
  }
  if (record.certifiedCount !== 8n) fail(`Expected certifiedCount 8, got ${record.certifiedCount}`);
  console.log(`✓ Ledger shows allCertified=true, isEthical=true, certifiedCount=8 (count only)`);

  // 6. recertifyProduct
  console.log(`Recertifying product ${productId}...`);
  await deployed.callTx.recertifyProduct(productId, 2030n * 365n * 24n * 3600n, suppliers);
  console.log('✓ recertifyProduct completed');

  ledger = await readLedger();
  record = ledger?.products.lookup(productId);
  if (record?.auditCount !== 1n) fail(`Expected auditCount 1 after recertify, got ${record?.auditCount}`);
  console.log('✓ auditCount incremented on chain');

  // 7. proveFairPricing
  console.log('Proving fair pricing (floor 100, actual price 120)...');
  await deployed.callTx.proveFairPricing(productId, 100n, suppliers);
  console.log('✓ proveFairPricing completed');

  ledger = await readLedger();
  record = ledger?.products.lookup(productId);
  if (!record?.fairPricing) fail('fairPricing not recorded as proven');
  if (record?.fairFloor !== 100n) fail(`Expected fairFloor 100, got ${record?.fairFloor}`);
  console.log('✓ fairPricing=true with public floor committed (prices stayed private)');

  // 8. withdrawClaim
  console.log(`Withdrawing claim for ${productId}...`);
  await deployed.callTx.withdrawClaim(productId);
  console.log('✓ withdrawClaim completed');

  ledger = await readLedger();
  if (ledger?.products.member(productId)) fail('Product still on ledger after withdrawClaim');
  console.log('✓ Product removed from ledger after claim withdrawal');

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
  console.log('\n✅ e2e-check passed');
}

main().catch((err) => {
  console.error('❌ e2e-check errored:', err);
  process.exit(1);
});
