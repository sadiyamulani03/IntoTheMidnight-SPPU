/**
 * Read the public state of the Supply Chain with Hidden Suppliers contract
 * straight from a Midnight indexer.
 *
 * Everything in this module reads PUBLIC data. The contract's whole point is
 * that the ledger only ever contains claims (booleans + an aggregate count),
 * never supplier identities, certificates, prices or routes. This module also
 * decodes that state with the compiled contract's ledger decoder — exactly the
 * same code the CLI uses.
 */
import type { ChargedState, StateValue } from '@midnight-ntwrk/compact-runtime';

/** A product's public certification record as stored on the ledger. */
export interface ProductClaim {
  productId: string;
  batchId: string;
  quantity: bigint;
  stage: number;
  isEthical: boolean;
  allCertified: boolean;
  certifiedCount: number;
  allRoutesCompliant: boolean;
  fairFloor: bigint;
  fairPricing: boolean;
  auditCount: number;
  complianceScore: number;
}

/** Lifecycle stages as published by the contract (1 → 3). */
export const STAGES = {
  1: 'MANUFACTURED',
  2: 'IN_TRANSIT',
  3: 'DELIVERED',
} as const;
export type Stage = keyof typeof STAGES;

export interface PublicLedger {
  products: ProductClaim[];
  authority: string;
  /** Raw hex state as served by the indexer (for diagnostics). */
  rawState: string;
}

export interface DashboardConfig {
  indexerUrl: string;
  contractAddress: string;
  network: string;
}

/** Resolve configuration from Vite env vars with chaines defaulting. */
export function getConfig(): DashboardConfig {
  return {
    indexerUrl:
      import.meta.env.VITE_INDEXER_URL ??
      import.meta.env.VITE_MIDNIGHT_INDEXER_URL ??
      'https://indexer.preview.midnight.network/api/v4/graphql',
    contractAddress:
      import.meta.env.VITE_CONTRACT_ADDRESS ??
      import.meta.env.VITE_MIDNIGHT_CONTRACT_ADDRESS ??
      '',
    network: import.meta.env.VITE_NETWORK ?? 'preview',
  };
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const CONTRACT_STATE_QUERY = `query ContractState($address: HexEncoded!) {
  contractAction(address: $address) {
    state
  }
}`;

/**
 * Query the indexer for the latest serialized contract state.
 * Returns `null` when the contract has no state yet.
 */
export async function fetchRawState(indexerUrl: string, address: string): Promise<string | null> {
  const response = await fetch(indexerUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: CONTRACT_STATE_QUERY, variables: { address } }),
  });
  if (!response.ok) {
    throw new Error(`Indexer returned HTTP ${response.status}`);
  }
  const json = (await response.json()) as {
    data?: { contractAction?: { state?: string } | null };
    errors?: Array<{ message?: string }>;
  };
  if (json.errors?.length) {
    throw new Error(`Indexer error: ${json.errors[0]?.message ?? 'unknown'}`);
  }
  return json.data?.contractAction?.state ?? null;
}

interface PublicLedgerRecord {
  batchId: string;
  quantity: bigint;
  stage: bigint;
  isEthical: boolean;
  allCertified: boolean;
  certifiedCount: bigint;
  allRoutesCompliant: boolean;
  fairFloor: bigint;
  fairPricing: boolean;
  auditCount: bigint;
  complianceScore: bigint;
}

interface LedgerDecoder {
  ledger(state: ChargedState | StateValue): {
    products: Iterable<[string, PublicLedgerRecord]>;
    authority: Uint8Array;
  };
}

let ledgerModule: LedgerDecoder | undefined;

/**
 * Load the compiled contract module. It is imported lazily (and only when a
 * state actually needs decoding) so the page still works when the contract
 * has not been compiled yet.
 */
async function getLedgerModule() {
  const loaded = ledgerModule ?? (await import('./contracts/contract/index.js'));
  ledgerModule = loaded;
  return loaded;
}

/** Decode a serialized state hex blob into the public ledger. */
export async function decodePublicLedger(stateHex: string): Promise<PublicLedger> {
  const { ContractState } = await import('@midnight-ntwrk/compact-runtime');
  const contractState = ContractState.deserialize(hexToBytes(stateHex));
  const module = await getLedgerModule();
  const decoded = module.ledger(contractState.data);

  const products: ProductClaim[] = [];
  for (const [productId, record] of decoded.products) {
    products.push({
      productId,
      batchId: record.batchId,
      quantity: record.quantity,
      stage: Number(record.stage),
      isEthical: record.isEthical,
      allCertified: record.allCertified,
      certifiedCount: Number(record.certifiedCount),
      allRoutesCompliant: record.allRoutesCompliant,
      fairFloor: record.fairFloor,
      fairPricing: record.fairPricing,
      auditCount: Number(record.auditCount),
      complianceScore: Number(record.complianceScore),
    });
  }
  products.sort((a, b) => a.productId.localeCompare(b.productId));

  return {
    products,
    authority: bytesToHex(decoded.authority),
    rawState: stateHex,
  };
}

/** Fetch and decode the latest public state of the deployed contract. */
export async function fetchPublicState(indexerUrl: string, address: string): Promise<PublicLedger | null> {
  const stateHex = await fetchRawState(indexerUrl, address);
  if (!stateHex) return null;
  return decodePublicLedger(stateHex);
}

/** Friendly labels for the public claims, used by the dashboard. */
export const CLAIM_LABELS: Record<keyof Omit<ProductClaim, 'productId' | 'batchId' | 'quantity' | 'stage' | 'certifiedCount' | 'fairFloor' | 'auditCount' | 'complianceScore'>, string> = {
  isEthical: 'Ethically sourced',
  allCertified: 'All suppliers certified',
  allRoutesCompliant: 'Routes compliant',
  fairPricing: 'Fair pricing proven',
};
