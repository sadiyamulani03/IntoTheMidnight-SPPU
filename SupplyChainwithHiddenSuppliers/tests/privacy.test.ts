/**
 * privacy.test.ts — "private inputs are never exposed".
 *
 * The ChainShield contract keeps supplier identities, certificates, prices and
 * routes PRIVATE: they exist only as zero-knowledge circuit inputs. The only
 * output of the contract is the on-chain ledger, so the "never exposed"
 * guarantee is structural — the public `Ledger` type must not be able to carry
 * any private supplier datum, while the circuit input type must carry them
 * (proving they genuinely are privacy witnesses, not fabricated).
 *
 * These are deterministic compile-time guarantees and run in vitest without a
 * prover.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const PRIVATE_SUPPLIER_FIELDS = ['identityHash', 'certExpiry', 'pricePaid', 'routeCompliant'];

function readManagedInterface(): string {
  const dts = path.join(projectRoot, 'contracts', 'managed', 'supply-chain', 'contract', 'index.d.ts');
  return fs.readFileSync(dts, 'utf-8');
}

function readCompactSource(): string {
  const src = path.join(projectRoot, 'contracts', 'supply-chain.compact');
  return fs.readFileSync(src, 'utf-8');
}

function sliceBetween(text: string, start: string, end: string): string {
  const i = text.indexOf(start);
  const j = text.indexOf(end, i >= 0 ? i : 0);
  if (i < 0 || j < 0) return '';
  return text.slice(i, j);
}

describe('public ledger cannot encode private supplier data', () => {
  const dts = readManagedInterface();
  const ledgerType = sliceBetween(dts, 'export type Ledger = {', 'export type ContractReferenceLocations');

  it('does not expose supplier identity hashes', () => {
    expect(ledgerType).not.toMatch(/identityHash/);
  });

  it('does not expose certificate expiry dates', () => {
    expect(ledgerType).not.toMatch(/certExpiry/);
  });

  it('does not expose prices paid', () => {
    expect(ledgerType).not.toMatch(/pricePaid/);
  });

  it('does not expose logistics routes', () => {
    expect(ledgerType).not.toMatch(/routeCompliant/);
  });

  it('exposes only public claims, a count and a committed floor', () => {
    for (const field of [
      'batchId', 'quantity', 'stage', 'isEthical', 'allCertified',
      'certifiedCount', 'fairPricing', 'fairFloor', 'complianceScore', 'auditCount',
    ]) {
      expect(ledgerType).toMatch(field);
    }
  });
});

describe('private supplier data are real circuit inputs', () => {
  const dts = readManagedInterface();
  const circuits = sliceBetween(dts, 'export type ProvableCircuits', 'export type PureCircuits');

  it('feeds the supplier list into every circuit as a witness/input', () => {
    expect(circuits).toMatch(/suppliers_0:/);
  });

  for (const field of PRIVATE_SUPPLIER_FIELDS) {
    it(`types the ${field} field on the private circuit input`, () => {
      expect(circuits).toMatch(new RegExp(field));
    });
  }
});

describe('compact source never writes a private field into the on-chain record', () => {
  const src = readCompactSource();
  // Remove the private `struct Supplier` block, leaving only circuit bodies and
  // the public `ProductRecord`; then a private field must not be assigned `:`.
  const structStart = src.indexOf('struct Supplier {');
  const structEnd = src.indexOf('struct ProductRecord');
  const body = structStart >= 0 && structEnd >= 0
    ? src.slice(0, structStart) + src.slice(structEnd)
    : src;

  for (const field of PRIVATE_SUPPLIER_FIELDS) {
    it(`does not publish ${field} into a ProductRecord`, () => {
      expect(body).not.toMatch(new RegExp(`${field}\\s*:`));
    });
  }
});