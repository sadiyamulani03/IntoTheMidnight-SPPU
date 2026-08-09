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
  // When a deployed contract address is configured (Pages/Vercel builds), read
  // the REAL ledger from the indexer. The seeded coffee ledger is only a
  // fallback for local dev with no contract (VITE_DEMO_MODE, no address).
  const demoMode = !!netConfig.demoMode && !netConfig.contractAddress;
  const contractAddress = netConfig.contractAddress.trim();

  const [load, setLoad] = useState<LoadState>({ status: 'loading' });

  const loadState = useCallback(async () => {
    if (demoMode) {
      setLoad((current) =>
        current.status === 'ready' && current.ledger.rawState === DEMO_SEED
          ? current
          : { status: 'ready', ledger: demoLedger() },
      );
      return;
    }
    if (!contractAddress) { setLoad({ status: 'empty' }); return; }
    setLoad({ status: 'loading' });
    try {
      const ledger = await fetchPublicState(netConfig.indexerUrl, contractAddress);
      setLoad(ledger ? { status: 'ready', ledger } : { status: 'empty' });
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [demoMode, contractAddress, netConfig.indexerUrl]);

  useEffect(() => { void loadState(); }, [loadState]);

  // Live-ledger auto-refresh (read-only) so a new proof shows up without a
  // manual reload. Demo mode is skipped — the seeded ledger only changes when a
  // simulated publish lands.
  useEffect(() => {
    if (demoMode) return;
    const id = setInterval(() => { void loadState(); }, 20_000);
    return () => clearInterval(id);
  }, [demoMode, loadState]);

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
          <span className="status-pill" title="Ledger state">
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
          <span>
            This is a <b>demo ledger</b> — the products below are seeded and the prove flow is
            simulated in the browser.
          </span>
        </div>
      )}

      <section className="hero">
        <span className="hero-eyebrow">{demoMode ? 'A Midnight demo' : 'Live on Midnight Preview'}</span>
        <h1>
          Ethical on the record. <span className="grad">Suppliers off it.</span>
        </h1>
        <p className="hero-sub">
          {demoMode ? (
            <>
              For this demo the products are single-origin coffee shipments. Each one carries four
              claims — certified suppliers, ethical sourcing, compliant routes, fair pricing —
              plus where it sits in the lifecycle. You can check every claim. The supplier names,
              certificates, prices and routes behind them are <strong>proved, not published</strong>.
            </>
          ) : (
            <>
              These are the products currently on the deployed contract. Each carries four claims —
              certified suppliers, ethical sourcing, compliant routes, fair pricing — plus where it
              sits in the lifecycle. Anyone can read them from the indexer. The supplier names,
              certificates, prices and routes behind them are <strong>proved, not published</strong>.
            </>
          )}
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
            <h2>Products on the ledger</h2>
            <span className="privacy-tag">claims public · records private</span>
          </div>

          {connectionOk && products.length > 0 ? (
            <>
              <LedgerOverview products={products} />
              <div className="products">
                {products.map((p) => <ProductRow key={p.productId} product={p} showTimeline={demoMode} />)}
              </div>
              {!demoMode && (
                <p className="hint" style={{ marginTop: 16, fontSize: 12.5, wordBreak: 'break-all' }}>
                  Contract: <code>{contractAddress}</code> · {load.status === 'ready' ? `authority key ${load.ledger.authority.slice(0, 20)}…` : 'reading…'} · refreshes every 20s
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              {load.status === 'loading'
                ? 'Reading ledger…'
                : load.status === 'error'
                  ? `Couldn't read the contract state: ${load.message}`
                  : demoMode
                    ? 'No products on the ledger yet — use Prove & publish to add one.'
                    : 'This contract has no products yet.'}
            </p>
          )}
        </section>

        <ConsumerVerify products={products} />

        <PrivacyExplainer />
      </main>

      <footer className="footer">
        <div className="foot-mark">ChainShield</div>
        <div>
          A Midnight ZK dApp. The claims live on the ledger; the supplier data behind them lives
          only inside proofs.
        </div>
      </footer>
    </>
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
            <div className="quick-stat"><div className="q-num">{product.certifiedCount}</div><div className="q-label">Certified suppliers</div></div>
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
                  Supplier names, certificate numbers, prices and routes — proved in
                  zero-knowledge, never published.
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
          <span className="panel-kicker">How it works</span>
          The chain sees the claim, never the paperwork
        </h2>
      </div>
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
          <div className="step-num">1</div>
          <h3>Keep it in the wallet</h3>
          <p>
            Supplier names, certs, prices and routes are assembled at proof time — inside the
            wallet or relay — and never stored anywhere else.
          </p>
        </div>
        <div className="privacy-step">
          <div className="step-num">2</div>
          <h3>Prove, don't show</h3>
          <p>
            A circuit checks a property — "all 26 suppliers are certified" — without naming who
            they are or what they were paid.
          </p>
        </div>
        <div className="privacy-step">
          <div className="step-num">3</div>
          <h3>Publish only the claim</h3>
          <p>
            The booleans, the certified count and a committed floor go on chain, where anyone can
            verify them.
          </p>
        </div>
      </div>

      <div className="boundary-box">
        <strong>What's actually on chain:</strong>
        <ul>
          <li>Claim booleans, the <code>certifiedCount</code> aggregate, the committed <code>fairFloor</code></li>
          <li>Lifecycle stage, <code>auditCount</code>, derived compliance score</li>
        </ul>
      </div>
    </section>
  );
}