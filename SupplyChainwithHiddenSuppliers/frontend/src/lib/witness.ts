/**
 * Private supply-chain witness construction — ChainShield.
 *
 * This module builds the 8-slot vector of supplier records that is fed into the
 * Midnight circuit as a ZERO-KNOWLEDGE WITNESS (private input). It is a pure,
 * side-effect-free builder so it is deterministically unit-testable.
 *
 * PRIVACY CONTRACT:
 *   • The supplier identities, certificates (expiry), prices paid and routes
 *     below are PRIVATE. They exist only inside this module while a proof is
 *     being generated, are handed to the circuit, and are dropped immediately.
 *   • They must NEVER be rendered in the UI, kept in React state, persisted to
 *     storage, or written to the console.
 *   • Only the aggregated, disclosed claims ever cross into the public ledger.
 */

export interface SupplierWitnessInput {
  identityHash: Uint8Array;
  isCertified: boolean;
  isEthical: boolean;
  certExpiry: bigint;
  pricePaid: bigint;
  routeCompliant: boolean;
}

export interface SupplyChainWitnessOptions {
  certified: boolean;
  ethical: boolean;
  routes: boolean;
  certExpiry: bigint;
  pricePaid: bigint;
}

export const SUPPLIER_VECTOR_SIZE = 8;

/**
 * Deterministically derive a 32-byte identity fingerprint for a fictional
 * supplier slot. Used only to give each slot a distinct binding — the real
 * protocol would hash the supplier's on-chain credential.
 */
export function identityFingerprint(label: string): Uint8Array {
  // FNV-1a 64, expanded to 32 bytes (4 x 8 bytes) — pure JS, deterministic.
  const out = new Uint8Array(32);
  const s = `supplier:${label}`;
  let h0 = 0xcbf29ce484222325n & 0xffffffffffffffffn;
  for (let i = 0; i < s.length; i++) {
    h0 ^= BigInt(s.charCodeAt(i) & 0xff);
    h0 = (h0 * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  const h1 = (h0 * 31n + 7n) & 0xffffffffffffffffn;
  const h2 = (h0 * 131n + 17n) & 0xffffffffffffffffn;
  const h3 = (h0 * 997n + 29n) & 0xffffffffffffffffn;
  const words = [h0, h1, h2, h3];
  for (let w = 0; w < 4; w++) {
    let v = words[w];
    for (let b = 0; b < 8; b++) {
      out[w * 8 + (7 - b)] = Number(v & 0xffn);
      v >>= 8n;
    }
  }
  return out;
}

/**
 * Build the private supplier vector used as the ZK witness. All slots share the
 * same attribute flags so a single mock list matches what the user toggles.
 */
export function buildSupplierWitness(opts: SupplyChainWitnessOptions): SupplierWitnessInput[] {
  const suppliers: SupplierWitnessInput[] = [];
  for (let i = 1; i <= SUPPLIER_VECTOR_SIZE; i++) {
    suppliers.push({
      identityHash: identityFingerprint(`tier-1-${i}`),
      isCertified: opts.certified,
      isEthical: opts.ethical,
      certExpiry: opts.certExpiry,
      pricePaid: opts.pricePaid,
      routeCompliant: opts.routes,
    });
  }
  return suppliers;
}