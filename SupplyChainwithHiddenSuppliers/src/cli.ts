/**
 * CLI for interacting with the Supply Chain with Hidden Suppliers contract.
 *
 * PRIVACY GUARANTEE: the supplier records you build below (identities,
 * certificates, prices, routes) are PRIVATE witness data. They are passed to
 * the proving machinery, used to generate a zero-knowledge proof, and then
 * dropped. Nothing about them is ever logged or written to the chain — only
 * the disclosed claims (booleans + aggregate count) are.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { Buffer } from 'buffer';

// Midnight SDK imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';
import { buildContract, zkConfigPath } from './contract';
import { deriveOwnerKey } from './keys';
import { buildSuppliers } from './suppliers';
import { createProviders } from './providers';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

// Must match the privateStateId used at deploy time so the CLI reconnects to
// the same private state.
const PRIVATE_STATE_ID = 'supplyChainPrivateState';

// ─── Network configuration ───────────────────────────────────────────────────

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const ownerKey = deriveOwnerKey(SEED);

// Prompts the user. When stdin is closed (piped input / EOF) the readline
// interface throws "readline was closed"; treat that as a clean exit.
async function ask(rl: import('node:readline/promises').Interface, prompt: string): Promise<string> {
  try {
    return await rl.question(prompt);
  } catch (error) {
    if (error instanceof Error && error.message === 'readline was closed') {
      console.log('\n  👋 Goodbye!\n');
      process.exit(0);
    }
    throw error;
  }
}

// The contract module (runtime value) is only needed for the public-state
// ledger decoder. It is loaded lazily so `npm run cli` gives a clear error
// (from buildContract) when the contract has not been compiled yet.
let supplyChainModule: any;

async function getSupplyChainModule() {
  if (!supplyChainModule) {
    supplyChainModule = await import(pathToFileURL(`${zkConfigPath}/contract/index.js`).href);
  }
  return supplyChainModule;
}

// ─── Public state reading (indexer) ───────────────────────────────────────────

async function readProducts(providers: Awaited<ReturnType<typeof createProviders>>, contractAddress: string) {
  const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!contractState) {
    console.log('\n  📋 No contract state found (empty ledger).\n');
    return;
  }
  const decoded = (await getSupplyChainModule()).ledger(contractState.data);
  const products = decoded.products;
  const STAGES: Record<number, string> = { 1: 'MANUFACTURED', 2: 'IN_TRANSIT', 3: 'DELIVERED' };
  console.log('\n  📋 Registered products:');
  if (products.isEmpty()) {
    console.log('     (none)');
  } else {
    for (const [productId, record] of products) {
      console.log(`     • ${productId}`);
      console.log(`         batch: ${record.batchId} | quantity: ${record.quantity} | stage: ${STAGES[Number(record.stage)] ?? record.stage}`);
      console.log(`         isEthical: ${record.isEthical} | allCertified: ${record.allCertified}`);
      console.log(`         certifiedCount: ${record.certifiedCount} / 8 | allRoutesCompliant: ${record.allRoutesCompliant}`);
      console.log(`         fairFloor: ${record.fairFloor} | fairPricing: ${record.fairPricing} | audits: ${record.auditCount}`);
      console.log(`         complianceScore: ${record.complianceScore} / 100`);
    }
  }
  console.log('');
}

// ─── Main CLI ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Supply Chain with Hidden Suppliers — CLI');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const rl = createInterface({ input: stdin, output: stdout });

  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run \`npm run setup -- --network ${network}\` first.`);
    process.exit(1);
  }
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Network: ${network}\n`);

  try {
    const seed = SEED;

    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet({ network, networkConfig, seed });
    const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
    if (restoredCount > 0) {
      console.log(`  Restored ${restoredCount}/3 child wallets from .midnight-wallet-state — sync will resume from saved point.`);
    }

    console.log('  Syncing with network...');
    console.log('  ℹ  This may take several minutes depending on network size.');
    console.log('     RPC disconnection messages during sync are normal and can be safely ignored.\n');
    const syncStart = Date.now();
    const syncInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - syncStart) / 1000);
      process.stdout.write(`\r  ⏳ Still syncing... (${elapsed}s elapsed)   `);
    }, 5000);
    const state = await walletCtx.wallet.waitForSyncedState();
    clearInterval(syncInterval);
    process.stdout.write('\r  ✓ Synced with network.                                      \n');

    await persistWalletState(network, walletCtx);
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    if (balance === 0n && network !== 'undeployed' && networkConfig.faucet) {
      const address = walletCtx.unshieldedKeystore.getBech32Address();
      console.log('  ⚠ Wallet has no tNight. Fund it from the faucet to send transactions:');
      console.log(`     ${networkConfig.faucet}`);
      console.log(`     Wallet address: ${address}\n`);
    }

    console.log('  Connecting to contract...');
    const providers = await createProviders({ networkConfig, walletCtx, privateStateStoreName: 'supply-chain-state' });
    const compiledContract = await buildContract(ownerKey);

    const deployed: any = await findDeployedContract(providers, {
      // Same dynamic-typing cast as deploy.ts / level1.
      compiledContract: compiledContract as any,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });

    console.log('  ✅ Connected!\n');

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Register a product (prove: all suppliers certified + ethical)');
      console.log('  2. Recertify a product (re-audit + cert-expiry policy)');
      console.log('  3. Prove fair pricing (all prices ≥ public floor)');
      console.log('  4. Ship a product (MANUFACTURED → IN_TRANSIT)');
      console.log('  5. Deliver a product (IN_TRANSIT → DELIVERED)');
      console.log('  6. Withdraw a claim (owner-only, ZK-authenticated)');
      console.log('  7. Read products (public state via indexer)');
      console.log('  8. Check wallet balance');
      console.log('  9. Exit\n');

      const choice = await ask(rl, '  Your choice: ');

      switch (choice.trim()) {
        case '1': {
          const productId = (await ask(rl, '  Product ID: ')).trim();
          const batchId = (await ask(rl, '  Batch ID: ')).trim();
          const quantity = BigInt((await ask(rl, '  Quantity (units): ')).trim() || '1000');
          const certified = (await ask(rl, '  All suppliers certified? (y/n): ')).trim().toLowerCase() === 'y';
          const ethical = (await ask(rl, '  All suppliers ethical? (y/n): ')).trim().toLowerCase() === 'y';
          const routes = (await ask(rl, '  All routes compliant? (y/n): ')).trim().toLowerCase() === 'y';
          const pricePaid = BigInt((await ask(rl, '  Unit price paid to suppliers: ')).trim() || '100');
          const suppliers = buildSuppliers({ certified, ethical, routes, certExpiry: 2100n * 365n * 24n * 3600n, pricePaid });
          console.log('\n  Proving without revealing your supplier list... (this may take 30-60s)');
          try {
            const tx = await deployed.callTx.registerProduct(productId, batchId, quantity, suppliers);
            console.log(`\n  ✅ Product registered: "${productId}"`);
            console.log(`     batch: ${batchId} | quantity: ${quantity} | stage: MANUFACTURED`);
            console.log(`     isEthical: ${ethical} | allCertified: ${certified} | certifiedCount: ${certified ? 8 : 0}`);
            console.log(`     Transaction ID: ${tx.public.txId}`);
            console.log(`     Block height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '2': {
          const productId = (await ask(rl, '  Product ID: ')).trim();
          const minExpiryYear = BigInt((await ask(rl, '  Min certificate expiry (year): ')).trim() || '2030');
          const certified = (await ask(rl, '  All suppliers still certified? (y/n): ')).trim().toLowerCase() === 'y';
          const ethical = (await ask(rl, '  All suppliers still ethical? (y/n): ')).trim().toLowerCase() === 'y';
          const routes = (await ask(rl, '  All routes compliant? (y/n): ')).trim().toLowerCase() === 'y';
          const suppliers = buildSuppliers({
            certified, ethical, routes,
            certExpiry: minExpiryYear * 365n * 24n * 3600n,
            pricePaid: 100n,
          });
          console.log('\n  Proving without revealing your supplier list... (this may take 30-60s)');
          try {
            const tx = await deployed.callTx.recertifyProduct(productId, minExpiryYear * 365n * 24n * 3600n, suppliers);
            console.log(`\n  ✅ Product recertified: "${productId}" (audit recorded on-chain)`);
            console.log(`     Transaction ID: ${tx.public.txId}`);
            console.log(`     Block height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '3': {
          const productId = (await ask(rl, '  Product ID: ')).trim();
          const fairFloor = BigInt((await ask(rl, '  Fair-trade price floor (tokens): ')).trim() || '90');
          const pricePaid = BigInt((await ask(rl, '  Unit price actually paid: ')).trim() || '120');
          const suppliers = buildSuppliers({
            certified: true, ethical: true, routes: true,
            certExpiry: 2100n * 365n * 24n * 3600n,
            pricePaid,
          });
          console.log('\n  Proving all prices ≥ floor WITHOUT revealing the prices... (this may take 30-60s)');
          try {
            const tx = await deployed.callTx.proveFairPricing(productId, fairFloor, suppliers);
            console.log(`\n  ✅ Fair pricing proven for "${productId}" (floor ${fairFloor.toString()} committed publicly, prices kept private)`);
            console.log(`     Transaction ID: ${tx.public.txId}`);
            console.log(`     Block height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '4': {
          const productId = (await ask(rl, '  Product ID: ')).trim();
          const suppliers = buildSuppliers({
            certified: true, ethical: true, routes: true,
            certExpiry: 2100n * 365n * 24n * 3600n,
            pricePaid: 100n,
          });
          console.log('\n  Proving routes + supplier status WITHOUT revealing the supplier list... (this may take 30-60s)');
          try {
            const tx = await deployed.callTx.shipProduct(productId, suppliers);
            console.log(`\n  ✅ Product shipped: "${productId}" → IN_TRANSIT`);
            console.log(`     Transaction ID: ${tx.public.txId}`);
            console.log(`     Block height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '5': {
          const productId = (await ask(rl, '  Product ID: ')).trim();
          const quantityDelivered = BigInt((await ask(rl, '  Quantity delivered: ')).trim() || '1000');
          const suppliers = buildSuppliers({
            certified: true, ethical: true, routes: true,
            certExpiry: 2100n * 365n * 24n * 3600n,
            pricePaid: 120n,
          });
          console.log('\n  Proving delivery conditions (quantity ≤ batch, routes, fair pay) WITHOUT revealing them... (this may take 30-60s)');
          try {
            const tx = await deployed.callTx.deliverProduct(productId, quantityDelivered, suppliers);
            console.log(`\n  ✅ Product delivered: "${productId}" → DELIVERED`);
            console.log(`     Transaction ID: ${tx.public.txId}`);
            console.log(`     Block height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '6': {
          const productId = (await ask(rl, '  Product ID: ')).trim();
          console.log('\n  Proving company ownership in zero-knowledge... (this may take 30-60s)');
          try {
            const tx = await deployed.callTx.withdrawClaim(productId);
            console.log(`\n  ✅ Claim withdrawn for "${productId}"`);
            console.log(`     Transaction ID: ${tx.public.txId}`);
            console.log(`     Block height: ${tx.public.blockHeight}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '7':
          await readProducts(providers, deployment.address);
          break;

        case '8': {
          console.log('\n  Checking balance...');
          const currentState = await walletCtx.wallet.waitForSyncedState();
          const currentBalance = currentState.unshielded.balances[unshieldedToken().raw] ?? 0n;
          const dustBalance = currentState.dust.balance(new Date());
          console.log(`\n  tNight: ${currentBalance.toLocaleString()}`);
          console.log(`  DUST: ${dustBalance.toLocaleString()}\n`);
          break;
        }

        case '9':
          running = false;
          console.log('\n  👋 Goodbye!\n');
          break;

        default:
          console.log('\n  ❌ Invalid choice. Please enter 1-9.\n');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
