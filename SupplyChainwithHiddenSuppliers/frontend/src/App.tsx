import { useCallback, useEffect, useState } from 'react';
import { fetchPublicState, CLAIM_LABELS, type ProductClaim, type PublicLedger } from './api';
import { getConfig } from './lib/networks';
import { useMidnight } from './hooks/useMidnight';
import { WalletConnect, NetworkBadge, shortAddress } from './components/WalletConnect';
import { ProveActions, type DemoPublish } from './components/ProveActions';
import { LedgerOverview } from './components/LedgerOverview';
import { ConsumerVerify } from './components/ConsumerVerify';
import { VerifierStatements } from './components/VerifierStatements';
import { demoLedger, demoProofHistory, type DemoProofEvent } from './lib/demo';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; ledger: PublicLedger }
  | { status: 'empty' }
  | { status: 'error'; message: string };

const STAGE_SHORT: Record<number, string> = { 1: 'MANUFACTURED', 2: 'IN_TRANSIT', 3: 'DELIVERED' };

const DEMO_SEED = 'demo-seed';

/** Recompose the compliance score from the four public claims (mirror of `scoreOf`). */
export function scoreFromClaims(c: {
  allCertified: boolean;
  isEthical: boolean;
  allRoutesCompliant: boolean;
  fairPricing: boolean;
}): number {
  return (
    (c.allCertified ? 30 : 0) +
    (c.isEthical ? 30 : 0) +
    (c.allRoutesCompliant ? 20 : 0) +
    (c.fairPricing ? 20 : 0)
  );
}

/** Apply a simulated publish to the in-memory demo ledger (front-end only). */
function applyDemoPublish(ledger: PublicLedger, p: DemoPublish): PublicLedger {
  let products = [...ledger.products];
  const existing = (id: string) => products.find((x) => x.productId === id);

  switch (p.circuit) {
    case 'registerProduct': {
      if (existing(p.productId)) break;
      products = [
        {
          productId: p.productId,
          batchId: p.batchId ?? 'N/A',
          quantity: BigInt(p.quantity || '0'),
          stage: 1,
          isEthical: p.ethical,
          allCertified: p.certified,
          certifiedCount: p.certified ? 8 : 0,
          allRoutesCompliant: p.routes,
          fairFloor: BigInt(p.floor || '0'),
          fairPricing: false,
          auditCount: 0,
          complianceScore: scoreFromClaims({
            allCertified: p.certified,
            isEthical: p.ethical,
            allRoutesCompliant: p.routes,
            fairPricing: false,
          }),
        },
        ...products,
      ];
      break;
    }
    case 'recertifyProduct':
      products = products.map((x) =>
        x.productId === p.productId ? { ...x, auditCount: x.auditCount + 1, allCertified: p.certified } : x,
      );
      break;
    case 'proveFairPricing':
      products = products.map((x) =>
        x.productId === p.productId
          ? { ...x, fairPricing: true, fairFloor: BigInt(p.floor || '0'), complianceScore: scoreFromClaims(x) }
          : x,
      );
      break;
    case 'shipProduct':
      products = products.map((x) => (x.productId === p.productId && x.stage < 2 ? { ...x, stage: 2 } : x));
      break;
    case 'deliverProduct':
      products = products.map((x) =>
        x.productId === p.productId && x.stage >= 2 && x.stage < 3 ? { ...x, stage: 3, auditCount: x.auditCount + 1 } : x,
      );
      break;
    case 'withdrawClaim':
      products = products.filter((x) => x.productId !== p.productId);
      break;
  }
  return { ...ledger, products };
}

export default function App() {
  const netConfig = getConfig();
  const wallet = useMidnight();
  const autoDemo = netConfig.demoMode && !netConfig.contractAddress;
  // Runtime toggle overrides the env default, so the seeded coffee ledger is
  // reachable even from the hosted build (no VITE_DEMO_MODE needed).
  const [demoOverride, setDemoOverride] = useState<boolean | null>(null);
  const demoMode = demoOverride ?? autoDemo;

  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [address, setAddress] = useState(netConfig.contractAddress);
  const [refreshKey, setRefreshKey] = useState(0);
  const [live, setLive] = useState(true);

  const loadState = useCallback(async () => {
    if (demoMode) {
      setLoad((current) =>
        current.status === 'ready' && current.ledger.rawState === DEMO_SEED
          ? current
          : { status: 'ready', ledger: demoLedger() },
      );
      return;
    }
    if (!address.trim()) { setLoad({ status: 'empty' }); return; }
    setLoad({ status: 'loading' });
    try {
      const ledger = await fetchPublicState(netConfig.indexerUrl, address.trim());
      setLoad(ledger ? { status: 'ready', ledger } : { status: 'empty' });
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [demoMode, address, netConfig.indexerUrl]);

  useEffect(() => { void loadState(); }, [loadState, refreshKey]);

  // Live auto-refresh of the public ledger (read-only). Skipped in demo mode —
  // the seeded ledger only changes when a simulated publish lands.
  useEffect(() => {
    if (!live || demoMode) return;
    const id = setInterval(() => { void loadState(); }, 15000);
    return () => clearInterval(id);
  }, [live, demoMode, loadState]);

  const onDemoPublished = useCallback((p: DemoPublish) => {
    setLoad((current) => {
      const base = current.status === 'ready' ? current.ledger : demoLedger();
      return { status: 'ready', ledger: applyDemoPublish(base, p) };
    });
  }, []);

  const products = load.status === 'ready' ? load.ledger.products : [];
  const connectionOk = load.status === 'ready';

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#">
            <span className="brand-mark">✦</span>
            <span className="brand-name">
              ChainShield
              <small>Hidden suppliers · Midnight</small>
            </span>
          </a>
          <div className="topbar-spacer" />
          <div className="seg-control" title="Source of the ledger on this page">
            <button
              className={`seg-button ${demoMode ? 'seg-on' : ''}`}
              onClick={() => setDemoOverride(true)}
              disabled={demoMode}
            >
              Demo
            </button>
            <button
              className={`seg-button ${!demoMode ? 'seg-on' : ''}`}
              onClick={() => setDemoOverride(false)}
              disabled={!demoMode}
            >
              Live
            </button>
          </div>
          <span className="status-pill" title="Indexer connection">
            <span className={`live-dot ${connectionOk ? 'on' : load.status === 'loading' ? 'busy' : 'off'}`} />
            {demoMode
              ? 'Demo ledger'
              : connectionOk
                ? 'Ledger live'
                : load.status === 'loading'
                  ? 'Reading ledger…'
                  : 'Ledger offline'}
          </span>
          <WalletConnect wallet={wallet} />
        </div>
      </header>

      {demoMode && (
        <div className="demo-banner">
          <b>Demo mode</b> — no wallet, no tNIGHT, no relay required. The ledger below is a seeded
          example and every “Prove &amp; publish” is simulated in-browser.
        </div>
      )}

      <section className="hero">
        <span className="hero-eyebrow">✦ Zero-knowledge supply chain</span>
        <h1>
          Ethical sourcing, <span className="grad">proven blind.</span>
        </h1>
        <p className="hero-sub">
          Every product below carries <strong>zero-knowledge proven</strong> claims — every supplier
          certified, ethically sourced, fair-trade priced — across a verifiable{' '}
          <strong>MANUFACTURED → IN_TRANSIT → DELIVERED</strong> lifecycle. The underlying supplier
          identities, certificates, prices and routes <strong>never leave a wallet</strong>.
        </p>
        <div className="hero-cta">
          <span className="chip"><b>{products.length}</b> product{(products.length === 1 ? '' : 's')} on ledger</span>
          <span className="chip"><b>{STAGE_SHORT[1]}</b> · <b>{STAGE_SHORT[2]}</b> · <b>{STAGE_SHORT[3]}</b></span>
          <span className="chip">
            <NetworkBadge label={wallet.networkLabel} />
          </span>
          {wallet.address && <span className="chip">wallet <b>{shortAddress(wallet.address)}</b></span>}
        </div>
      </section>

      <main className="page">
        <ProveActions wallet={wallet} config={netConfig} products={products} demoMode={demoMode} onDemoPublished={onDemoPublished} />

        <section className="panel">
          <div className="panel-head">
            <h2>
              <span className="panel-kicker">Public certification ledger</span>
              Readable by anyone
            </h2>
            <span className="privacy-tag">private data never leaves the wallet</span>
          </div>

          <div className="ledger-actions">
            <div className="field">
              <span>Contract address</span>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contract ID (from .midnight-state.json / .env)"
                spellCheck={false}
                style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-base" onClick={() => setRefreshKey((k) => k + 1)} disabled={!address.trim()}>
                Refresh
              </button>
              <button className={`toggle-pill ${live ? 'on' : ''}`} onClick={() => setLive((l) => !l)}>
                {live ? 'auto-refresh on' : 'auto-refresh off'}
              </button>
            </div>
          </div>

          <p className="hint" style={{ fontSize: 12.5 }}>
            Network: <strong>{netConfig.network}</strong> · Indexer:{' '}
            <code>{netConfig.indexerUrl}</code>
          </p>

          {load.status === 'loading' && (
            <div className="loading-row">
              <span className="prove-spinner" />
              Decoding on-chain state…
            </div>
          )}
          {load.status === 'error' && <p className="error">Failed to read state: {load.message}</p>}
          {load.status === 'empty' && (
            <p className="muted">
              Enter a deployed contract address above, or run <code>npm run setup</code> first.
            </p>
          )}
          {connectionOk && products.length === 0 && (
            <p className="muted">Contract is deployed but no products are registered yet.</p>
          )}
          {connectionOk && products.length > 0 && (
            <>
              <KpiDashboard products={products} />
              <LedgerOverview products={products} />
              <div className="products">
                {products.map((p) => <ProductRow key={p.productId} product={p} showTimeline={demoMode} />)}
              </div>
              <p className="hint" style={{ marginTop: 16, fontSize: 12.5 }}>
                Company authority key: <code>{load.status === 'ready' ? load.ledger.authority : ''}</code>
              </p>
            </>
          )}
        </section>

        <ConsumerVerify products={products} />

        <PrivacyExplainer />
      </main>

      <footer className="footer">
        <div className="foot-mark">✦ ChainShield</div>
        <div>
          <b>Supply Chain with Hidden Suppliers</b> — a Midnight Network ZK dApp. Public claims and
          counts are on-chain; identities, certifications, prices and routes exist only inside proofs.
        </div>
      </footer>
    </>
  );
}

/* ---------------------------------------------------------------------------
   KPI dashboard
--------------------------------------------------------------------------- */
function KpiDashboard({ products }: { products: ProductClaim[] }) {
  const total = products.length;
  const delivered = products.filter((p) => p.stage >= 3).length;
  const inTransit = products.filter((p) => p.stage === 2).length;
  const avg = total === 0 ? 0 : Math.round(products.reduce((s, p) => s + p.complianceScore, 0) / total);
  const certified = products.filter((p) => p.allCertified).length;
  const fair = products.filter((p) => p.fairPricing).length;
  const fully = products.filter((p) => p.complianceScore >= 100).length;

  return (
    <div className="kpis">
      <div className="kpi brand-tone">
        <div className="kpi-value">{total}</div>
        <div className="kpi-label">Products on ledger</div>
        <div className="kpi-sub">{delivered} delivered · {inTransit} in transit</div>
      </div>
      <div className="kpi ok-tone">
        <div className="kpi-value">{certified}/{total}</div>
        <div className="kpi-label">All suppliers certified</div>
        <div className="mini-bar"><i style={{ width: `${total ? (certified / total) * 100 : 0}%` }} /></div>
      </div>
      <div className="kpi warn-tone">
        <div className="kpi-value">{fair}/{total}</div>
        <div className="kpi-label">Fair-pricing proven</div>
        <div className="mini-bar"><i style={{ width: `${total ? (fair / total) * 100 : 0}%` }} /></div>
      </div>
      <div className="kpi">
        <div className="kpi-value">{fully}<span style={{ fontSize: 16, color: 'var(--muted)' }}>/{total}</span></div>
        <div className="kpi-label">100% compliant</div>
        <div className="kpi-sub">avg compliance score {avg}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Product card
--------------------------------------------------------------------------- */
function ClaimBadge({ ok }: { ok: boolean }) {
  return <span className={`badge ${ok ? 'badge-ok' : 'badge-no'}`}>{ok ? '✓' : '✕'}</span>;
}

function ProductRow({ product, showTimeline = false }: { product: ProductClaim; showTimeline?: boolean }) {
  const [open, setOpen] = useState(false);
  const history: DemoProofEvent[] = showTimeline ? demoProofHistory(product.productId) : [];
  return (
    <div className={`product-card ${open ? 'open' : ''}`}>
      <button className="product-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="product-id">{product.productId}</span>
        <span className="brand-mark" style={{ width: 26, height: 26, fontSize: 14 }}>✦</span>
        <span className="product-top-meta">
          <span className="badge badge-stage">{STAGE_SHORT[product.stage]}</span>
          <span className="muted">{product.auditCount} re-audit{product.auditCount === 1 ? '' : 's'}</span>
          <span className="toggle">▾</span>
        </span>
      </button>
      <div className="product-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="quick-stats">
            <div className="quick-stat"><div className="q-num">{product.complianceScore}/100</div><div className="q-label">Compliance</div></div>
            <div className="quick-stat"><div className="q-num">{product.quantity.toString()}</div><div className="q-label">Units</div></div>
            <div className="quick-stat"><div className="q-num">{product.certifiedCount}</div><div className="q-label">Certified / 8</div></div>
          </div>
          <StageBar stage={product.stage} />
          <ScoreBar score={product.complianceScore} />
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
            Batch <code>{product.batchId}</code> · fair-trade floor{' '}
            <code>{product.fairFloor.toString()}</code> (actual prices stay private)
          </p>
          {history.length > 0 && <ProofTimeline events={history} />}
        </div>

        <div>
          <div className="product-claims">
            {[
              { ok: product.isEthical, label: CLAIM_LABELS.isEthical },
              { ok: product.allCertified, label: CLAIM_LABELS.allCertified },
              { ok: product.allRoutesCompliant, label: CLAIM_LABELS.allRoutesCompliant },
              { ok: product.fairPricing, label: CLAIM_LABELS.fairPricing },
            ].map((c) => (
              <div key={c.label} className="claim">
                <ClaimBadge ok={c.ok} />
                <span>{c.label}</span>
              </div>
            ))}
          </div>

          {open && (
            <>
              <VerifierStatements product={product} />
              <p className="claim-reveal">
                <span className="live-dot on" />
                <span>
                  Supplier identities, certificate numbers, prices paid and transport routes are
                  hidden — proved in zero-knowledge, never published.
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StageBar({ stage }: { stage: number }) {
  const steps = [1, 2, 3] as const;
  return (
    <div className="stage-bar">
      {steps.map((step) => (
        <div key={step} className={`stage-step ${stage >= step ? 'stage-on' : ''}`}>
          <span className="stage-dot" />
          <span className="stage-name">{STAGE_SHORT[step]}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const tone = score >= 100 ? 'score-full' : score >= 60 ? 'score-mid' : 'score-low';
  return (
    <div className="score-row">
      <span className="muted" style={{ fontSize: 12.5 }}>Compliance</span>
      <div className="score-track">
        <div className={`score-fill ${tone}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="score-value">{score}</span>
    </div>
  );
}

function ProofTimeline({ events }: { events: DemoProofEvent[] }) {
  return (
    <div className="proof-timeline">
      <div className="timeline-title">proof history</div>
      <ol className="timeline-list">
        {events.map((e, i) => (
          <li key={`${e.circuit}-${i}`}>
            <span className="tl-dot" />
            <span className="tl-body">
              <span className="tl-row">
                <strong className="tl-circuit">{e.circuit}</strong>
                <span className="tl-at">{e.at}</span>
              </span>
              <span className="tl-summary">{e.summary}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Privacy explainer
--------------------------------------------------------------------------- */
function PrivacyExplainer() {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>
          <span className="panel-kicker">Selective disclosure</span>
          How privacy works
        </h2>
        <span className="privacy-tag">ZK proof, not data</span>
      </div>
      <p>
        Instead of revealing the fact, ChainShield publishes a <strong>proof of the fact</strong>.
      </p>
      <ul className="zk-examples">
        <li>
          <span className="reveal">Supplier: ABC Cotton Ltd · Maharashtra · cert A-2214</span>
          <span className="arr">→</span>
          <strong>✓ Supplier is government certified</strong>
        </li>
        <li>
          <span className="reveal">Transport temperature: 3.4°C</span>
          <span className="arr">→</span>
          <strong>✓ Temperature remained within the required range</strong>
        </li>
        <li>
          <span className="reveal">Price paid: ₹1,250,000</span>
          <span className="arr">→</span>
          <strong>✓ Fair-trade price ≥ public floor</strong>
        </li>
      </ul>

      <div className="privacy-flow">
        <div className="privacy-step">
          <div className="step-num">STEP 01</div>
          <h3>Witness in the wallet</h3>
          <p>
            Supplier identities, certs, expiries, prices and routes live only inside the wallet /
            relay, generated at proof time.
          </p>
        </div>
        <div className="privacy-step">
          <div className="step-num">STEP 02</div>
          <h3>Zero-knowledge proof</h3>
          <p>
            A circuit proves a property — "all 26 suppliers are certified" — without revealing who
            they are or what they were paid.
          </p>
        </div>
        <div className="privacy-step">
          <div className="step-num">STEP 03</div>
          <h3>Claim only on chain</h3>
          <p>
            Booleans, the certified count and a committed floor cross the boundary — and can be
            verified by anyone.
          </p>
        </div>
      </div>

      <div className="boundary-box">
        <strong>Only these cross the proof boundary:</strong>
        <ul>
          <li>Claim booleans, the <code>certifiedCount</code> aggregate, the committed <code>fairFloor</code></li>
          <li>Lifecycle stage, <code>auditCount</code>, derived compliance score</li>
        </ul>
        <p className="muted" style={{ margin: '10px 0 0', fontSize: 13 }}>
          Supplier identities, certificate numbers + expiries, prices paid and routes never leave the
          wallet — generated at proof time, used for the proof, and dropped.
        </p>
      </div>
    </section>
  );
}