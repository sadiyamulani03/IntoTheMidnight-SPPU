import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  isNetworkId,
  NETWORK_IDS,
  parseNetworkFlag,
  resolveNetwork,
  getOrCreateSeed,
  getDeployment,
  recordDeployment,
  setActiveNetwork,
  GENESIS_SEED,
} from '../src/network.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-network-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('isNetworkId / NETWORK_IDS', () => {
  it('accepts the three supported network ids', () => {
    for (const id of NETWORK_IDS) expect(isNetworkId(id)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isNetworkId('mainnet')).toBe(false);
    expect(isNetworkId('')).toBe(false);
    expect(isNetworkId(42)).toBe(false);
  });
});

describe('parseNetworkFlag', () => {
  it('parses --network <id>', () => {
    expect(parseNetworkFlag(['node', 'script', '--network', 'preview'])).toBe('preview');
  });

  it('parses --network=<id>', () => {
    expect(parseNetworkFlag(['node', 'script', '--network=preprod'])).toBe('preprod');
  });

  it('returns null when absent', () => {
    expect(parseNetworkFlag(['node', 'script'])).toBeNull();
  });

  it('throws on unknown network', () => {
    expect(() => parseNetworkFlag(['node', 'script', '--network', 'moon'])).toThrow(/Unknown network/);
  });

  it('throws when --network has no value', () => {
    expect(() => parseNetworkFlag(['node', 'script', '--network'])).toThrow(/requires a value/);
  });
});

describe('resolveNetwork', () => {
  it('defaults to undeployed without flag or state file', () => {
    const r = resolveNetwork({ argv: ['node', 'script'], cwd: tmpDir, env: {} });
    expect(r.network).toBe('undeployed');
    expect(r.source).toBe('default');
    expect(r.config.proofServer).toBe('http://127.0.0.1:6300');
  });

  it('flag wins over state file', () => {
    recordDeployment('preview', '0xabc', 'deployer', { cwd: tmpDir });
    const r = resolveNetwork({ argv: ['node', 'script', '--network', 'preprod'], cwd: tmpDir, env: {} });
    expect(r.network).toBe('preprod');
    expect(r.source).toBe('flag');
  });

  it('falls back to the active network persisted in state', () => {
    setActiveNetwork('preview', { cwd: tmpDir });
    const r = resolveNetwork({ argv: ['node', 'script'], cwd: tmpDir, env: {} });
    expect(r.network).toBe('preview');
    expect(r.source).toBe('state');
  });

  it('applies MIDNIGHT_PROOF_SERVER_URL env override', () => {
    const r = resolveNetwork({
      argv: ['node', 'script'],
      cwd: tmpDir,
      env: { MIDNIGHT_PROOF_SERVER_URL: 'http://127.0.0.1:9999' },
    });
    expect(r.config.proofServer).toBe('http://127.0.0.1:9999');
  });
});

describe('getOrCreateSeed', () => {
  it('returns the genesis seed on undeployed networks', () => {
    expect(getOrCreateSeed('undeployed', { cwd: tmpDir, env: {} })).toBe(GENESIS_SEED);
  });

  it('prefers the MIDNIGHT_WALLET_SEED env var', () => {
    const seed = getOrCreateSeed('preview', { cwd: tmpDir, env: { MIDNIGHT_WALLET_SEED: 'env-seed' } });
    expect(seed).toBe('env-seed');
    expect(fs.existsSync(path.join(tmpDir, '.midnight-state.json'))).toBe(false);
  });

  it('generates and persists a seed for non-undeployed networks', () => {
    const seed = getOrCreateSeed('preview', { cwd: tmpDir, env: {} });
    expect(seed).toMatch(/^[0-9a-f]{64}$/);
    const again = getOrCreateSeed('preview', { cwd: tmpDir, env: {} });
    expect(again).toBe(seed);
  });
});

describe('deployment records', () => {
  it('records and retrieves a deployment per network', () => {
    expect(getDeployment('preview', { cwd: tmpDir })).toBeNull();
    recordDeployment('preview', '0x1234', 'deployer-1', { cwd: tmpDir });
    const dep = getDeployment('preview', { cwd: tmpDir });
    expect(dep?.address).toBe('0x1234');
    expect(dep?.deployer).toBe('deployer-1');
    expect(dep?.deployedAt).toBeTruthy();
    // deployments are keyed per network
    expect(getDeployment('preprod', { cwd: tmpDir })).toBeNull();
  });

  it('setActiveNetwork updates the active network', () => {
    setActiveNetwork('preprod', { cwd: tmpDir });
    expect(resolveNetwork({ argv: ['node', 'script'], cwd: tmpDir, env: {} }).network).toBe('preprod');
  });
});
