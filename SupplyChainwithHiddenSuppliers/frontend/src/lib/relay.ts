/**
 * relay.ts — client for the local ChainShield wallet relay.
 *
 * The browser calls this local API (npm run relay) to run REAL Midnight proofs
 * against the devnet. The relay builds the PRIVATE supplier witness server-side,
 * uses it for the zero-knowledge proof and drops it — so the browser never
 * handles, transmits, logs or stores any private supplier data. The response
 * this client returns contains ONLY the public transaction id / block.
 */
export type RelayCircuit = 'register' | 'recertify' | 'fair-pricing' | 'ship' | 'deliver' | 'withdraw';

export interface RelayResult {
  ok: boolean;
  txId?: string;
  blockHeight?: string;
  message?: string;
}

export interface RelayRequest {
  productId: string;
  batchId?: string;
  quantity?: string;
  quantityDelivered?: string;
  fairFloor?: string;
  minExpiryYear?: string;
  certified?: boolean;
  ethical?: boolean;
  routes?: boolean;
}

export async function relayHealth(relayUrl: string): Promise<boolean> {
  try {
    const r = await fetch(`${relayUrl}/health`);
    if (!r.ok) return false;
    const j = (await r.json()) as { ok?: boolean };
    return j.ok === true;
  } catch {
    return false;
  }
}

export async function callRelay(
  relayUrl: string,
  circuit: RelayCircuit,
  req: RelayRequest,
): Promise<RelayResult> {
  try {
    const r = await fetch(`${relayUrl}/api/${circuit}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    const j = (await r.json()) as RelayResult;
    return j;
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}