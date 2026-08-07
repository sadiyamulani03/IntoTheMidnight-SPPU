import { WebSocket } from 'ws';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { resolveNetwork, getOrCreateSeed, getDeployment } from '../src/network.js';
import { createWallet } from '../src/wallet.js';
import { deriveOwnerKey } from '../src/keys.js';
import { buildContract } from '../src/contract.js';
import { createProviders } from '../src/providers.js';
import { buildSuppliers } from '../src/suppliers.js';

globalThis.WebSocket = WebSocket;
const PRIVATE_STATE_ID = 'supplyChainPrivateState';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);
const deployment = getDeployment(network);
if (!deployment) {
  console.error('No deployment on file');
  process.exit(1);
}

const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
await walletCtx.wallet.waitForSyncedState();
const providers = await createProviders({ networkConfig, walletCtx, privateStateStoreName: 'supply-chain-state' });
const compiledContract = await buildContract(deriveOwnerKey(SEED));
const deployed: any = await findDeployedContract(providers, {
  compiledContract: compiledContract as any,
  contractAddress: deployment.address,
  privateStateId: PRIVATE_STATE_ID,
  initialPrivateState: {},
});

const productId = `prod-${Date.now()}`;
const batchId = `batch-${Date.now()}`;
const quantity = 1000n;
const suppliers = buildSuppliers({
  certified: true,
  ethical: true,
  routes: true,
  certExpiry: 2100n * 365n * 24n * 3600n,
  pricePaid: 120n,
});

// Product A: full lifecycle → DELIVERED, score 100
await deployed.callTx.registerProduct(productId, batchId, quantity, suppliers);
console.log(`REGISTERED ${productId}`);
await deployed.callTx.recertifyProduct(productId, 2030n * 365n * 24n * 3600n, suppliers);
await deployed.callTx.proveFairPricing(productId, 100n, suppliers);
await deployed.callTx.shipProduct(productId, suppliers);
await deployed.callTx.deliverProduct(productId, quantity, suppliers);

// Product B: shipped but not yet delivered → IN_TRANSIT, score 100
const productB = `prod-${Date.now() + 1}`;
await deployed.callTx.registerProduct(productB, `batch-${Date.now() + 1}`, quantity, suppliers);
await deployed.callTx.proveFairPricing(productB, 100n, suppliers);
await deployed.callTx.shipProduct(productB, suppliers);

// Product C: just registered → MANUFACTURED, score 80
const productC = `prod-${Date.now() + 2}`;
await deployed.callTx.registerProduct(productC, `batch-${Date.now() + 2}`, quantity, suppliers);

console.log('DEMO_PRODUCTS=' + [productId, productB, productC].join(','));
await walletCtx.wallet.stop();
