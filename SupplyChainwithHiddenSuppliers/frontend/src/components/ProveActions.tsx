/**
 * ProveActions — the ChainShield "prove & publish" feature.
 *
 * Each action generates a ZERO-KNOWLEDGE proof about a product and publishes
 * only the *claim* on chain. The underlying supplier witness (identities,
 * certs, prices, routes) is built either by the local proof RELAY (server-side,
 * dropped immediately) or in-browser via the connector — it is never rendered,
 * kept in React state, persisted, or logged.
 *
 * Public form inputs:
 *   productId / batchId / quantity / quantityDelivered / floor / minExpiryYear
 *   + the three claim booleans (certified / ethical / routes).
 * The private "price paid to suppliers" is a demo witness value auto-filled and
 * dropped inside the proof — it never reaches a UI field, log or store.
 *
 * Every submit is labelled: "Proved without revealing your input."
 */
import { useEffect, useState } from 'react';
import type { UseMidnightReturn } from '../hooks/useMidnight';
import { buildSupplierWitness } from '../lib/witness';
import { submitCircuit, type CircuitKind, type ProveOutcome } from '../lib/prove';
import { callRelay, relayHealth, type RelayCircuit } from '../lib/relay';
import type { ChainShieldEnv } from '../lib/networks';
import type { ProductClaim } from '../api';

type Wire =
  | 'registerProduct'
  | 'recertifyProduct'
  | 'proveFairPricing'
  | 'shipProduct'
  | 'deliverProduct'
  | 'withdrawClaim';

const CIRCUITS: { kind: Wire; label: string; desc: string; ownerOnly?: boolean }[] = [
  { kind: 'registerProduct', label: 'Register product', desc: 'MANUFACTURED — every supplier certified, ethical, routes compliant.' },
  { kind: 'recertifyProduct', label: 'Re-certify', desc: 'Re-prove claims + no lapsed certs; bumps the on-chain audit.' },
  { kind: 'proveFairPricing', label: 'Prove fair pricing', desc: 'Every price ≥ public floor — prices stay private.' },
  { kind: 'shipProduct', label: 'Ship product', desc: 'MANUFACTURED → IN_TRANSIT.' },
  { kind: 'deliverProduct', label: 'Deliver product', desc: 'IN_TRANSIT → DELIVERED.' },
  { kind: 'withdrawClaim', label: 'Withdraw claim', desc: 'Owner-only; removes a claim — ownership proven in ZK.', ownerOnly: true },
];

const RELAY_CIRCUIT: Record<CircuitKind, RelayCircuit> = {
  registerProduct: 'register',
  recertifyProduct: 'recertify',
  proveFairPricing: 'fair-pricing',
  shipProduct: 'ship',
  deliverProduct: 'deliver',
  withdrawClaim: 'withdraw',
};

const PRIVATE_STATE_ID = 'supplyChainPrivateState';
const CLAIM_TOGGLES: { key: 'certified' | 'ethical' | 'routes'; label: string }[] = [
  { key: 'certified', label: 'every supplier certified' },
  { key: 'ethical', label: 'ethically sourced' },
  { key: 'routes', label: 'routes compliant' },
];

interface FlowForm {
  productId: string;
  batchId: string;
  quantity: string;
  quantityDelivered: string;
  floor: string;
  minExpiryYear: string;
  certified: boolean;
  ethical: boolean;
  routes: boolean;
}

export function ProveActions({
  wallet,
  config,
  products,
}: {
  wallet: UseMidnightReturn;
  config: ChainShieldEnv;
  products: ProductClaim[];
}) {
  const [active, setActive] = useState<Wire>('registerProduct');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ProveOutcome | null>(null);
  const [relayOk, setRelayOk] = useState<boolean | null>(null);
  const [form, setForm] = useState<FlowForm>({
    productId: 'PROD-A1',
    batchId: 'BATCH-001',
    quantity: '1000',
    quantityDelivered: '1000',
    floor: '90',
    minExpiryYear: '2030',
    certified: true,
    ethical: true,
    routes: true,
  });

  const patch = (p: Partial<FlowForm>) => setForm((f) => ({ ...f, ...p }));
  const connected = wallet.state.status === 'connected' && !!wallet.address;

  useEffect(() => {
    let alive = true;
    relayHealth(config.relayUrl).then((ok) => alive && setRelayOk(ok)).catch(() => alive && setRelayOk(false));
    return () => { alive = false; };
  }, [config.relayUrl]);

  if (!config.enableProve) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>
            <span className="panel-kicker">Prove &amp; publish</span>
            Zero-knowledge claims
          </h2>
        </div>
        <p className="hint">
          Wallet publishing is disabled in this build. To activate it, set{' '}
          <code>VITE_ENABLE_PROVE=true</code> in <code>frontend/.env.local</code> (and run{' '}
          <code>npm run relay</code> for the local proof relay). Reading the public certification
          ledger below still works.
        </p>
      </div>
    );
  }

  const run = async () => {
    setBusy(true);
    setOutcome(null);
    // PRIVATE witness: built here, consumed by the prover, never stored/logged.
    const suppliers = buildSupplierWitness({
      certified: form.certified,
      ethical: form.ethical,
      routes: form.routes,
      certExpiry: 2100n * 365n * 24n * 3600n,
      pricePaid: 120n, // demo price — dropped after proving
    });

    const pubArgs: unknown[] = [];
    switch (active) {
      case 'registerProduct':
        pubArgs.push(form.productId, form.batchId, BigInt(form.quantity || '0'));
        break;
      case 'recertifyProduct':
        pubArgs.push(form.productId, BigInt(form.minExpiryYear) * 365n * 24n * 3600n);
        break;
      case 'proveFairPricing':
        pubArgs.push(form.productId, BigInt(form.floor || '0'));
        break;
      case 'shipProduct':
        pubArgs.push(form.productId);
        break;
      case 'deliverProduct':
        pubArgs.push(form.productId, BigInt(form.quantityDelivered || '0'));
        break;
      case 'withdrawClaim':
        pubArgs.push(form.productId);
        break;
    }

    try {
      // Privacy contract: private `suppliers` never leaves this function for the
      // wire. The local relay builds the witness and runs the proof server-side.
      let outcomeOf: ProveOutcome;
      if (!wallet.connector) {
        const result = await callRelay(config.relayUrl, RELAY_CIRCUIT[active as CircuitKind], {
          productId: form.productId,
          batchId: form.batchId,
          quantity: form.quantity,
          quantityDelivered: form.quantityDelivered,
          fairFloor: form.floor,
          minExpiryYear: form.minExpiryYear,
          certified: form.certified,
          ethical: form.ethical,
          routes: form.routes,
        });
        outcomeOf = result.ok
          ? {
              ok: true,
              circuit: active,
              txId: result.txId ?? '',
              blockHeight: BigInt(result.blockHeight ?? '0'),
            }
          : { ok: false, message: result.message ?? 'Relay declined the request.' };
      } else {
        outcomeOf = await submitCircuit(
          wallet.connector,
          config.contractAddress,
          PRIVATE_STATE_ID,
          active as CircuitKind,
          pubArgs,
          suppliers,
        );
      }

      setOutcome(outcomeOf);
    } catch (err) {
      setOutcome({ ok: false, message: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>
          <span className="panel-kicker">Zero-knowledge</span>
          Prove &amp; publish a claim
        </h2>
        <span className="privacy-tag">Proved without revealing your input</span>
      </div>

      <div className="prove-stack">
        <p className="muted">
          Each action creates a <strong>zero-knowledge proof</strong> from the private supplier
          list and publishes only the disclosed claim. Identities, certificates, prices and routes
          are dropped the instant a proof is produced.
        </p>

        <div className="status-pill" style={{ alignSelf: 'flex-start' }}>
          <span className={`live-dot ${relayOk === null ? 'busy' : relayOk ? 'on' : 'off'}`} />
          {relayOk === null
            ? 'Checking proof relay…'
            : relayOk
              ? 'Proof relay online'
              : `Proof relay offline at ${config.relayUrl}/health`}
        </div>

        {outcome?.ok === false && outcome.message && <p className="error">{outcome.message}</p>}

        <div className="circuit-grid">
          {CIRCUITS.map((c) => (
            <button
              key={c.kind}
              className={`circuit-card ${active === c.kind ? 'active' : ''}`}
              onClick={() => setActive(c.kind)}
              disabled={busy}
            >
              <strong>{c.label}</strong>
              <span>{c.desc}</span>
              {c.ownerOnly && <em className="owner-tag">owner only</em>}
            </button>
          ))}
        </div>

        <div className="form-grid">
          {active !== 'proveFairPricing' && (
            <Field label="Product ID">
              <input value={form.productId} onChange={(e) => patch({ productId: e.target.value })} spellCheck={false} />
            </Field>
          )}
          {active === 'registerProduct' && (
            <>
              <Field label="Batch ID">
                <input value={form.batchId} onChange={(e) => patch({ batchId: e.target.value })} spellCheck={false} />
              </Field>
              <Field label="Quantity (units)">
                <input value={form.quantity} onChange={(e) => patch({ quantity: e.target.value })} />
              </Field>
            </>
          )}
          {active === 'recertifyProduct' && (
            <Field label="Minimum certificate expiry (year)">
              <input value={form.minExpiryYear} onChange={(e) => patch({ minExpiryYear: e.target.value })} />
            </Field>
          )}
          {active === 'proveFairPricing' && (
            <>
              <Field label="Product ID">
                <input value={form.productId} onChange={(e) => patch({ productId: e.target.value })} spellCheck={false} />
              </Field>
              <Field label="Fair-trade floor (public)">
                <input value={form.floor} onChange={(e) => patch({ floor: e.target.value })} />
              </Field>
            </>
          )}
          {active === 'deliverProduct' && (
            <Field label="Quantity delivered">
              <input value={form.quantityDelivered} onChange={(e) => patch({ quantityDelivered: e.target.value })} />
            </Field>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="muted" style={{ fontSize: 12.5 }}>
            These claim booleans are published; the underlying supplier records stay private.
          </span>
          <div className="toggle-row">
            {CLAIM_TOGGLES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`toggle-pill ${form[t.key] ? 'on' : ''}`}
                onClick={() => patch({ [t.key]: !form[t.key] })}
              >
                {form[t.key] ? '✓ ' : '✕ '}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="submit-row">
          <button
            className="btn-base btn-primary"
            disabled={!connected || busy || !config.contractAddress}
            onClick={() => void run()}
          >
            {busy ? 'Proving…' : 'Prove & publish'}
          </button>
          {busy && (
            <span className="proof-status">
              <span className="prove-spinner" />
              generating zero-knowledge proof — private data never leaves the relay
            </span>
          )}
          {!connected && !busy && <span className="hint">Connect a wallet to authenticate the publish.</span>}
          {!config.contractAddress && <span className="hint">Set VITE_CONTRACT_ADDRESS to point at a deployment.</span>}
        </div>

        {outcome?.ok === true && (
          <div className="outcome-box ok">
            <span>
              <strong>Publish confirmed.</strong> Proved without revealing your input — claim is on-chain.
            </span>
            <span>
              Circuit <code>{outcome.circuit}</code> · Tx ID <code>{outcome.txId}</code> · block{' '}
              <code>{outcome.blockHeight.toString()}</code>
            </span>
          </div>
        )}

        {products.length > 0 && (
          <div className="prove-note">
            <b>On-chain products:</b>{' '}
            {products.slice(0, 6).map((p) => p.productId).join(', ')}
            {products.length > 6 ? ` +${products.length - 6} more` : ''} — pick an ID above to link a
            new proof to an existing record.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}