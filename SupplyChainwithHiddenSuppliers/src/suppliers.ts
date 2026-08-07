/**
 * Private supplier witness construction.
 *
 * These helpers build the vector of supplier records that feed the ZK proofs.
 * The records are PRIVATE witness data: they are consumed by the proving
 * machinery and then dropped — they must never be logged or written anywhere.
 * This module is side-effect free so it can be unit-tested in isolation.
 */
import { createHash } from 'node:crypto';

export interface SupplierWitness {
  identityHash: Uint8Array;
  isCertified: boolean;
  isEthical: boolean;
  certExpiry: bigint;
  pricePaid: bigint;
  routeCompliant: boolean;
}

/** The contract fixes the supplier vector length to 8 slots. */
export const SUPPLIER_VECTOR_SIZE = 8;

/** Build a 32-byte identity hash for a fictional supplier label. */
export function identityHash(label: string): Uint8Array {
  return new Uint8Array(createHash('sha256').update(`supplier:${label}`, 'utf8').digest());
}

export interface BuildSuppliersOptions {
  certified: boolean;
  ethical: boolean;
  routes: boolean;
  certExpiry: bigint;
  pricePaid: bigint;
}

/**
 * Build the private supplier vector. `certified`/`ethical`/`routes` apply to
 * every slot so a single mock list matches what the user is testing.
 */
export function buildSuppliers(opts: BuildSuppliersOptions): SupplierWitness[] {
  const suppliers: SupplierWitness[] = [];
  for (let i = 1; i <= SUPPLIER_VECTOR_SIZE; i++) {
    suppliers.push({
      identityHash: identityHash(`tier-1-${i}`),
      isCertified: opts.certified,
      isEthical: opts.ethical,
      certExpiry: opts.certExpiry,
      pricePaid: opts.pricePaid,
      routeCompliant: opts.routes,
    });
  }
  return suppliers;
}
