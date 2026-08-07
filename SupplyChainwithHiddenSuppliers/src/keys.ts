/**
 * Pure key-derivation helpers. No side effects: importing this module must
 * never touch the network, the filesystem or process state.
 */
import * as crypto from 'node:crypto';

// Domain separator used to derive the company's authority key from the wallet
// seed. The same derivation is used by the deployer and the CLI so the owner
// can later withdraw claims.
const OWNER_KEY_DOMAIN = 'supply-chain:owner-key';

/** Derive the 32-byte company authority key deterministically from the seed. */
export function deriveOwnerKey(seed: string): Uint8Array {
  const digest = crypto.createHash('sha256').update(`${seed}:${OWNER_KEY_DOMAIN}`, 'utf8').digest();
  return new Uint8Array(digest);
}
