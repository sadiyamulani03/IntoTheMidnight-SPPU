import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { buildContract, zkConfigPath } from '../src/contract.js';
import { deriveOwnerKey } from '../src/keys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

describe('compiled contract artifacts', () => {
  it('managed contract output exists (run: npm run compile)', () => {
    const indexJs = path.join(zkConfigPath, 'contract', 'index.js');
    const indexDts = path.join(zkConfigPath, 'contract', 'index.d.ts');
    expect(fs.existsSync(indexJs)).toBe(true);
    expect(fs.existsSync(indexDts)).toBe(true);
  });

  it('emits a Witnesses type for the companySecretKey witness', () => {
    const indexDts = fs.readFileSync(path.join(zkConfigPath, 'contract', 'index.d.ts'), 'utf-8');
    expect(indexDts).toContain('companySecretKey');
    expect(indexDts).toContain('export declare class Contract');
  });

  it('exposes ledger/product fields matching the contract header', () => {
    const indexDts = fs.readFileSync(path.join(zkConfigPath, 'contract', 'index.d.ts'), 'utf-8');
    for (const field of ['registerProduct', 'recertifyProduct', 'proveFairPricing', 'withdrawClaim']) {
      expect(indexDts).toContain(field);
    }
    for (const field of ['isEthical', 'allCertified', 'certifiedCount', 'fairPricing']) {
      expect(indexDts).toContain(field);
    }
  });
});

describe('buildContract', () => {
  let cc: Awaited<ReturnType<typeof buildContract>>;

  beforeAll(async () => {
    cc = await buildContract(deriveOwnerKey('test-seed'));
  });

  it('tags the binding as the supply-chain contract', () => {
    expect(cc.tag).toBe('supply-chain');
  });

  it('points at the compiled assets path', () => {
    expect(CompiledContract.getCompiledAssetsPath(cc)).toBe(zkConfigPath);
  });
});

describe('unused buildContract error path', () => {
  it('works when the owner key differs from the witness seed', async () => {
    const cc = await buildContract(deriveOwnerKey('different-seed'));
    expect(cc.tag).toBe('supply-chain');
  });
});
