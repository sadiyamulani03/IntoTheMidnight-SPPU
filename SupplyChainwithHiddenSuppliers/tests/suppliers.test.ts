import { describe, it, expect } from 'vitest';
import { identityHash, buildSuppliers, SUPPLIER_VECTOR_SIZE } from '../src/suppliers.js';
import { deriveOwnerKey } from '../src/keys.js';

describe('identityHash', () => {
  it('produces exactly 32 bytes', () => {
    expect(identityHash('tier-1-1').length).toBe(32);
  });

  it('is deterministic', () => {
    const a = identityHash('tier-1-3');
    const b = identityHash('tier-1-3');
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it('distinguishes distinct labels', () => {
    const a = Buffer.from(identityHash('tier-1-1'));
    const b = Buffer.from(identityHash('tier-1-2'));
    expect(a.equals(b)).toBe(false);
  });
});

describe('buildSuppliers', () => {
  const opts = {
    certified: true,
    ethical: true,
    routes: true,
    certExpiry: 2100n * 365n * 24n * 3600n,
    pricePaid: 120n,
  };

  it('builds exactly the fixed vector length the contract expects', () => {
    expect(buildSuppliers(opts)).toHaveLength(SUPPLIER_VECTOR_SIZE);
  });

  it('assigns unique identity hashes to every slot', () => {
    const suppliers = buildSuppliers(opts);
    const hashes = new Set(suppliers.map((s) => Buffer.from(s.identityHash).toString('hex')));
    expect(hashes.size).toBe(SUPPLIER_VECTOR_SIZE);
  });

  it('carries the declared attributes into every slot', () => {
    for (const s of buildSuppliers(opts)) {
      expect(s.isCertified).toBe(true);
      expect(s.isEthical).toBe(true);
      expect(s.routeCompliant).toBe(true);
      expect(s.certExpiry).toBe(opts.certExpiry);
      expect(s.pricePaid).toBe(opts.pricePaid);
    }
  });

  it('propagates negative answers (unvetted suppliers)', () => {
    const suppliers = buildSuppliers({ ...opts, certified: false, ethical: false });
    for (const s of suppliers) {
      expect(s.isCertified).toBe(false);
      expect(s.isEthical).toBe(false);
    }
  });
});

describe('deriveOwnerKey', () => {
  it('produces exactly 32 bytes', () => {
    expect(deriveOwnerKey('seed').length).toBe(32);
  });

  it('is deterministic per seed', () => {
    const a = Buffer.from(deriveOwnerKey('abc'));
    const b = Buffer.from(deriveOwnerKey('abc'));
    expect(a.equals(b)).toBe(true);
  });

  it('differs across seeds', () => {
    const a = Buffer.from(deriveOwnerKey('abc'));
    const b = Buffer.from(deriveOwnerKey('def'));
    expect(a.equals(b)).toBe(false);
  });
});
