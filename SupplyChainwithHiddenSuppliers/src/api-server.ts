/**
 * ChainShield wallet relay — a tiny local API that lets the browser dashboard
 * execute REAL zero-knowledge proofs against the Midnight devnet without a
 * browser wallet extension.
 *
 * The relay runs the SAME wallet/contract stack as the CLI (src/wallet.ts,
 * src/providers.ts, src/contract.ts). The PRIVATE supplier witness (identities,
 * certificates, prices, routes) is built HERE, used for the proof, and dropped —
 * it never reaches the browser and never goes on chain. The UI only ever sends
 * PUBLIC inputs (product id, quantity, claim booleans, fair floor) and receives
 * back the PUBLIC transaction id / block.
 *
 * Usage:  npm run relay     (listens on http://127.0.0.1:8787)
 */
import { createServer } from 'node:http';
import { WebSocket } from 'ws';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet } from './wallet';
import { buildContract } from './contract';
import { deriveOwnerKey } from './keys';
import { buildSuppliers, wipeSuppliers } from './suppliers';
import { createProviders } from './providers';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = 'supplyChainPrivateState';
const PORT = Number(process.env.CHAINSHIELD_RELAY_PORT ?? 8787);
const ALLOWED_ORIGIN = process.env.CHAINSHIELD_ALLOWED_ORIGIN ?? 'http://localhost:5173';

let deployed: any;
let providers: Awaited<ReturnType<typeof createProviders>>;
let walletCtx: Awaited<ReturnType<typeof createWallet>>;
let deploymentAddress = '';

// ─── Boot the wallet + connect the contract ───────────────────────────────────

async function boot() {
  const { network, config: networkConfig } = resolveNetwork();
  const seed = getOrCreateSeed(network);
  const deployment = getDeployment(network);
  if (!deployment) throw new Error(`No deploy on file for network ${network}. Run: npm run setup`);

  walletCtx = await createWallet({ network, networkConfig, seed });
  console.log('  Syncing wallet…');
  await walletCtx.wallet.waitForSyncedState();
  console.log(`  Wallet ready: ${walletCtx.unshieldedKeystore.getBech32Address().toString()}`);

  providers = await createProviders({ networkConfig, walletCtx, privateStateStoreName: 'supply-chain-relay' });
  const compiledContract = await buildContract(deriveOwnerKey(seed));
  deployed = await findDeployedContract(providers, {
    compiledContract: compiledContract as any,
    contractAddress: deployment.address,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
  });
  deploymentAddress = deployment.address;
  console.log(`  Contract connected: ${deployment.address}`);
}

// ─── Private witness from PUBLIC claim flags ───────────────────────────────────
//
// PRIVACY INVARIANT: the relay NEVER accepts private witness data from the
// client. The only fields read off the request are PUBLIC claim *flags*; every
// private datum (identity, cert expiry, price paid, route) is derived inside
// this process, used for the proof, and dropped. `pricePaid` in particular is
// NOT an input to this server — it is a fixed constant below, so no client can
// steer or observe it.

interface ClaimFlags { certified?: boolean; ethical?: boolean; routes?: boolean; }

// Price paid to each supplier. Fixed server-side so the browser can never read
// or influence it; the fair-pricing circuit merely proves `pricePaid >= floor`.
const RELAY_PRICE_PAID = 150n;

// Certificate expiry the relay asserts on every supplier (epoch seconds).
const RELAY_CERT_EXPIRY = 2100n * 365n * 24n * 3600n;

function witnessFor(flags: ClaimFlags) {
  // The PRIVATE supplier vector. Built here, consumed by the prover, dropped.
  return buildSuppliers({
    certified: flags.certified ?? true,
    ethical: flags.ethical ?? true,
    routes: flags.routes ?? true,
    certExpiry: RELAY_CERT_EXPIRY,
    pricePaid: RELAY_PRICE_PAID,
  });
}

// ─── HTTP plumbing ─────────────────────────────────────────────────────────────

function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}

function json(res: any, code: number, body: unknown) {
  cors(res);
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c: Buffer) => (data += c.toString('utf8')));
    req.on('end', () => {
      if (!data.trim()) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

async function runCircuit(circuit: string, args: unknown[], witness?: ReturnType<typeof witnessFor>) {
  const start = Date.now();
  const tx = await deployed.callTx[circuit](...args);
  const ms = Date.now() - start;
  if (witness) wipeSuppliers(witness);
  return { txId: tx.public.txId, blockHeight: String(tx.public.blockHeight), provingMs: ms };
}

// ─── Server ────────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    if (path === '/health' && req.method === 'GET') return json(res, 200, { ok: true, contract: deploymentAddress });

    if (path === '/api/register' && req.method === 'POST') {
      const b = await readBody(req);
      const q = BigInt(b.quantity ?? 0);
      const w = witnessFor(b);
      const tx = await runCircuit('registerProduct', [String(b.productId), String(b.batchId), q, w], w);
      return json(res, 200, { ok: true, ...tx });
    }

    if (path === '/api/recertify' && req.method === 'POST') {
      const b = await readBody(req);
      const minExpiry = BigInt(b.minExpiryYear ?? 2030) * 365n * 24n * 3600n;
      const w = witnessFor(b);
      const tx = await runCircuit('recertifyProduct', [String(b.productId), minExpiry, w], w);
      return json(res, 200, { ok: true, ...tx });
    }

    if (path === '/api/fair-pricing' && req.method === 'POST') {
      const b = await readBody(req);
      const floor = BigInt(b.fairFloor ?? 0);
      const w = witnessFor(b);
      const tx = await runCircuit('proveFairPricing', [String(b.productId), floor, w], w);
      return json(res, 200, { ok: true, ...tx });
    }

    if (path === '/api/ship' && req.method === 'POST') {
      const b = await readBody(req);
      const w = witnessFor(b);
      const tx = await runCircuit('shipProduct', [String(b.productId), w], w);
      return json(res, 200, { ok: true, ...tx });
    }

    if (path === '/api/deliver' && req.method === 'POST') {
      const b = await readBody(req);
      const q = BigInt(b.quantityDelivered ?? 0);
      const w = witnessFor(b);
      const tx = await runCircuit('deliverProduct', [String(b.productId), q, w], w);
      return json(res, 200, { ok: true, ...tx });
    }

    if (path === '/api/withdraw' && req.method === 'POST') {
      const b = await readBody(req);
      const tx = await runCircuit('withdrawClaim', [String(b.productId)]);
      return json(res, 200, { ok: true, ...tx });
    }

    return json(res, 404, { ok: false, message: `No route ${req.method} ${path}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json(res, 500, { ok: false, message: msg });
  }
});

server.listen(PORT, '127.0.0.1', async () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  ChainShield wallet relay (local devnet)');
  console.log(`╚═══════════════════════════════════════════════════════╝`);
  console.log(`  Listening: http://127.0.0.1:${PORT}`);
  console.log('  Loading wallet + connecting to the deployed contract…');
  try {
    await boot();
    console.log('  ✅ Relay ready.');
  } catch (err) {
    console.error('  ❌ Boot failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
});