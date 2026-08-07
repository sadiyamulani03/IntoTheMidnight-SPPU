/**
 * ProveActions — the ChainShield "prove & publish" feature.
 *
 * Each action generates a ZERO-KNOWLEDGE proof about a product and publishes
 * only the *claim* on chain. The underlying supplier witness (identities,
 * certs, prices, routes) is built locally (lib/witness.ts), fed into the
 * circuit for the proof, and dropped immediately — it is never rendered, kept
 * in React state, persisted, or logged.
 *
 * Public form inputs:
 *   productId / batchId / quantity / quantityDelivered / floor / minExpiryYear
 *   + the three claim booleans (certified / ethical / routes).
 * The private "price paid to suppliers" is a demo witness value auto-filled and
 * dropped inside the proof — it never reaches a UI field, log or store.
 *
 * Every submit is labelled: "Proved without revealing your input."
 */
import { useState } from 'react';
import type { UseMidnightReturn } from '../hooks/useMidnight';
import { buildSupplierWitness } from '../lib/witness';
import { submitCircuit, type CircuitKind, type ProveOutcome } from '../lib/prove';
import type { ChainShieldEnv } from '../lib/networks';

type Wire =
  | 'registerProduct'
  | 'recertifyProduct'
  | 'proveFairPricing'
  | 'shipProduct'
  | 'deliverProduct';

const CIRCUITS: { kind: Wire; label: string; desc: string }[] = [
  { kind: 'registerProduct', label: 'Register product', desc: 'MANUFACTURED — every supplier certified, ethical, routes compliant.' },
  { kind: 'recertifyProduct', label: 'Re-certify', desc: 'Re-prove claims + no lapsed certs; bumps the on-chain audit.' },
  { kind: 'proveFairPricing', label: 'Prove fair pricing', desc: 'Every price ≥ public floor — prices stay private.' },
  { kind: 'shipProduct', label: 'Ship product', desc: 'MANUFACTURED → IN_TRANSIT.' },
  { kind: 'deliverProduct', label: 'Deliver product', desc: 'IN_TRANSIT → DELIVERED.' },
];

const PRIVATE_STATE_ID = 'supplyChainPrivateState';

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

export function ProveActions({ wallet, config }: { wallet: UseMidnightReturn; config: ChainShieldEnv }) {
  const [active, setActive] = useState<Wire>('registerProduct');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ProveOutcome | null>(null);
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

  if (!config.enableProve) {
    return (
      <div className="panel">
        <h2>Prove &amp; publish Zero-Knowledge claims</h2>
        <p className="hint">
          Wallet publishing is disabled in this build. To activate it, install the Midnight
          Wallet extension, fund it on <strong>Preview</strong>, and set{' '}
          <code>VITE_ENABLE_PROVE=true</code> in <code>.env.local</code>. Reading the
          public certification ledger below still works.
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
    }

    try {
      const outcomeOf = wallet.connector
        ? await submitCircuit(
            wallet.connector,
            config.contractAddress,
            PRIVATE_STATE_ID,
            active as CircuitKind,
            pubArgs,
            suppliers,
          )
        : { ok: false as const, message: 'Wallet not connected.' };

      // Privacy contract: `suppliers` goes out of scope here; never log it.
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
        <h2>Prove &amp; publish a claim</h2>
        <span className="privacy-tag">Proved without revealing your input</span>
      </div>

      <p className="muted">
        Each action creates a <strong>zero-knowledge proof</strong> from the private
        supplier list and publishes only the disclosed claim. Supplier identities,
        certificates, prices and routes never render, are never stored, and are dropped
        the moment the proof is produced.
      </p>

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

      <div className="claim-flags">
        <span className="muted">These claim booleans are published; the underlying supplier records stay private.</span>
        <label>
          <input type="checkbox" checked={form.certified} onChange={(e) => patch({ certified: e.target.checked })} /> every supplier certified
        </label>
        <label>
          <input type="checkbox" checked={form.ethical} onChange={(e) => patch({ ethical: e.target.checked })} /> ethically sourced
        </label>
        <label>
          <input type="checkbox" checked={form.routes} onChange={(e) => patch({ routes: e.target.checked })} /> routes compliant
        </label>
      </div>

      <div className="action-row">
        <button
          className="btn btn-primary"
          disabled={!connected || busy || !config.contractAddress}
          onClick={() => void run()}
        >
          {busy ? 'Proving…' : 'Prove & publish'}
        </button>
        {!connected && <span className="hint">Connect a wallet to publish a proof.</span>}
        {!config.contractAddress && <span className="hint">Set VITE_CONTRACT_ADDRESS to point at a deployment.</span>}
      </div>

      {busy && (
        <p className="hint">⏳ Generating the zero-knowledge proof… The private supplier list is not shown or stored anywhere.</p>
      )}
      {outcome?.ok === true && (
        <div className="success">
          <p><strong>Proved without revealing your input.</strong> Claim published on-chain.</p>
          <p className="hint">
            Tx ID <code>{outcome.txId}</code> · block {outcome.blockHeight.toString()}
          </p>
        </div>
      )}
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