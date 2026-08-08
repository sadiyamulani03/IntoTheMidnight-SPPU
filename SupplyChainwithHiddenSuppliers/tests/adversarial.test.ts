/**
 * adversarial.test.ts — "claims cannot be faked" (fail-closed) guarantees.
 *
 * The supply-chain contract is fail-closed: a submitted proof that uses a
 * stale certificate, an out-of-range price, a skipped lifecycle stage, or an
 * unregistered product must be REJECTED by the circuit — both in the Compact
 * source and in the compiled interface. These are structural, deterministic
 * checks (no prover needed) that mirror what the privacy tests do: the circuit
 * MUST `assert` the guard before it allows the transition.
 *
 * Separately, the relay's privacy boundary is enforced here: a supplied
 * `pricePaid` (or any private witness datum) from a client route must never be
 * accepted by the server, and the witness buffers are zeroed after proving.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSuppliers, wipeSuppliers } from '../src/suppliers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function readCompactSource(): string {
  return fs.readFileSync(path.join(projectRoot, 'contracts', 'supply-chain.compact'), 'utf-8');
}

function readRelayServer(): string {
  return fs.readFileSync(path.join(projectRoot, 'src', 'api-server.ts'), 'utf-8');
}

function assertGate(source: string, circuit: string, assertion: string, message: string) {
  const i = source.indexOf(`export circuit ${circuit}(`);
  expect(i, `circuit ${circuit} not found`).toBeGreaterThan(-1);
  const j = source.indexOf('}\n\nexport circuit', i);
  const body = source.slice(i, j > 0 ? j : source.length);
  expect(body.includes(assertion), `expected "${assertion}" inside ${circuit}`).toBe(true);
  expect(body.includes(`"${message}"`), `expected "${message}" message inside ${circuit}`).toBe(true);
}

describe('fail-closed: lifecycle stage ordering cannot be skipped', () => {
  const src = readCompactSource();

  it('shipProduct requires the product to be in MANUFACTURED (stage 1) first', () => {
    assertGate(src, 'shipProduct', 'assert(record.stage == (1 as Uint<8>)', 'Product is not in MANUFACTURED stage');
  });

  it('deliverProduct requires the product to be IN_TRANSIT (stage 2) first', () => {
    assertGate(src, 'deliverProduct', 'assert(record.stage == (2 as Uint<8>)', 'Product is not in IN_TRANSIT stage');
  });

  it('deliverProduct caps the delivered quantity to the committed batch', () => {
    assertGate(src, 'deliverProduct', 'quantityDelivered <= record.quantity', 'Delivered quantity exceeds the committed batch');
  });
});

describe('fail-closed: stale certificates and unregistered products', () => {
  const src = readCompactSource();

  it('recertify rejects any supplier whose certificate expires before the policy threshold', () => {
    assertGate(src, 'recertifyProduct', 's.certExpiry >= minExpiry', 'A supplier certificate expires before the policy threshold');
  });

  it('recertify rejects a product that was never registered', () => {
    assertGate(src, 'recertifyProduct', 'products.member', 'Product is not registered');
  });

  it('registerProduct rejects a duplicate product id', () => {
    assertGate(src, 'registerProduct', '!products.member', 'Product already registered');
  });
});

describe('fail-closed: out-of-range prices cannot be attested', () => {
  const src = readCompactSource();

  it('proveFairPricing requires every pricePaid to reach the public floor', () => {
    assertGate(src, 'proveFairPricing', 's.pricePaid >= fairFloor', 'Not every supplier is paid at least the fair-trade floor');
  });

  it('deliverProduct re-checks prices against the committed floor', () => {
    assertGate(src, 'deliverProduct', 's.pricePaid >= record.fairFloor', 'Not every supplier is paid at least the fair-trade floor');
  });
});

describe('relay privacy boundary: the server never accepts private witness data, and zeroes it after use', () => {
  const server = readRelayServer();

  it('pricePaid is NOT read from the client request', () => {
    expect(server).not.toMatch(/flags\.pricePaid/);
    expect(server).not.toMatch(/b\.pricePaid/);
    expect(server).not.toMatch(/req.*pricePaid/);
  });

  it('derives the private witness from a fixed server-side price constant', () => {
    expect(server).toMatch(/RELAY_PRICE_PAID|RELAY_PRICE/);
  });

  it('zeroes the witness buffers after proving (wipeSuppliers wired in)', () => {
    expect(server).toMatch(/wipeSuppliers\(/);
  });

  it('wipeSuppliers zeroes identity hashes and price/expiry numbers in place', () => {
    const suppliers = buildSuppliers({
      certified: true, ethical: true, routes: true,
      certExpiry: 0x12345n, pricePaid: 0xabcdefn,
    });
    expect(Buffer.from(suppliers[0].identityHash).some((b) => b !== 0)).toBe(true);
    wipeSuppliers(suppliers);
    for (const s of suppliers) {
      expect(Buffer.from(s.identityHash).every((b) => b === 0)).toBe(true);
      expect(s.certExpiry).toBe(0n);
      expect(s.pricePaid).toBe(0n);
    }
  });
});

describe('COMPACT source: circuit bodies only classify claims via fold over the private vector', () => {
  const src = readCompactSource();

  it('registerProduct evaluates certified/ethical/routes as folds over ALL suppliers', () => {
    for (const f of ['s.isCertified', 's.isEthical', 's.routeCompliant']) {
      expect(src.slice(0, src.indexOf('recertifyProduct'))).toContain(f);
    }
  });

  it('the aggregate certified count is computed off the private vector, never disclosed per-supplier', () => {
    expect(src).toMatch(/s\.isCertified \? 1 : 0/);
    expect(src).not.toMatch(/disclose\([^)]*identityHash/);
    expect(src).not.toMatch(/identityHash:\s*disclose/);
  });

  it('never discloses identities, expiries, prices or routes across the boundary', () => {
    for (const field of ['identityHash', 'certExpiry', 'pricePaid', 'routeCompliant']) {
      expect(src).not.toMatch(new RegExp(`disclose\\([^)]*${field}`));
    }
  });
});