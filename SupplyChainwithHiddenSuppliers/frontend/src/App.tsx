import { useCallback, useEffect, useState } from 'react';
import { fetchPublicState, CLAIM_LABELS, STAGES, type ProductClaim, type PublicLedger } from './api';
import { getConfig } from './lib/networks';
import { useMidnight } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { ProveActions } from './components/ProveActions';
import { LedgerOverview } from './components/LedgerOverview';
import { ConsumerVerify } from './components/ConsumerVerify';
import { VerifierStatements } from './components/VerifierStatements';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; ledger: PublicLedger }
  | { status: 'empty' }
  | { status: 'error'; message: string };

const BOOL: Record<string, string> = { true: '✔', false: '✖' };

function ClaimBadge({ ok }: { ok: boolean }) {
  return <span className={`badge ${ok ? 'badge-ok' : 'badge-no'}`}>{BOOL[String(ok)]}</span>;
}

function StageBar({ stage }: { stage: number }) {
  const steps = [1, 2, 3] as const;
  return (
    <div className="stage-bar">
      {steps.map((step) => (
        <div key={step} className={`stage-step ${stage >= step ? 'stage-on' : ''}`}>
          <span className="stage-dot" />
          <span className="stage-name">{STAGES[step]}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const tone = score >= 100 ? 'score-full' : score >= 60 ? 'score-mid' : 'score-low';
  return (
    <div className="score-row">
      <span className="muted">Compliance score</span>
      <div className="score-track">
        <div className={`score-fill ${tone}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <strong className="score-value">{score}/100</strong>
    </div>
  );
}

function ProductRow({ product }: { product: ProductClaim }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="product-card">
      <button className="product-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="product-id">{product.productId}</span>
        <span className="audits">re-audits on chain: {product.auditCount}</span>
        <span className="toggle">{open ? '▴' : '▾'}</span>
      </button>
      <div className="product-meta">
        <span className="muted">batch:</span> <code>{product.batchId}</code>
        <span className="muted"> · quantity:</span> {product.quantity.toString()} units
      </div>
      <StageBar stage={product.stage} />
      <ScoreBar score={product.complianceScore} />
      <div className="product-claims">
        <div className="claim"><ClaimBadge ok={product.isEthical} /><span>{CLAIM_LABELS.isEthical}</span></div>
        <div className="claim">
          <ClaimBadge ok={product.allCertified} />
          <span>{CLAIM_LABELS.allCertified}</span>
          <span className="muted">({product.certifiedCount} of 8 suppliers certified — count only, identities never revealed)</span>
        </div>
        <div className="claim"><ClaimBadge ok={product.allRoutesCompliant} /><span>{CLAIM_LABELS.allRoutesCompliant}</span></div>
        <div className="claim">
          <ClaimBadge ok={product.fairPricing} />
          <span>{CLAIM_LABELS.fairPricing}</span>
          <span className="muted">(fair-trade floor: {product.fairFloor.toString()} — actual prices stay private)</span>
        </div>
      </div>
      {open && <VerifierStatements product={product} />}
    </div>
  );
}

function Stats({ products }: { products: ProductClaim[] }) {
  const total = products.length;
  const delivered = products.filter((p) => p.stage >= 3).length;
  const inTransit = products.filter((p) => p.stage === 2).length;
  const avgScore = total === 0 ? 0 : Math.round(products.reduce((s, p) => s + p.complianceScore, 0) / total);
  const fullyCompliant = products.filter((p) => p.complianceScore >= 100).length;
  return (
    <div className="stats">
      <div className="stat"><span className="stat-num">{total}</span><span className="stat-label">products</span></div>
      <div className="stat"><span className="stat-num">{delivered}</span><span className="stat-label">delivered</span></div>
      <div className="stat"><span className="stat-num">{inTransit}</span><span className="stat-label">in transit</span></div>
      <div className="stat"><span className="stat-num">{fullyCompliant}/{total}</span><span className="stat-label">100% compliant</span></div>
      <div className="stat"><span className="stat-num">{avgScore}</span><span className="stat-label">avg score</span></div>
    </div>
  );
}

export default function App() {
  const netConfig = getConfig();
  const wallet = useMidnight();

  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [address, setAddress] = useState(netConfig.contractAddress);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadState = useCallback(async () => {
    if (!address.trim()) { setLoad({ status: 'empty' }); return; }
    setLoad({ status: 'loading' });
    try {
      const ledger = await fetchPublicState(netConfig.indexerUrl, address.trim());
      setLoad(ledger ? { status: 'ready', ledger } : { status: 'empty' });
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }, [address, netConfig.indexerUrl]);

  useEffect(() => { void loadState(); }, [loadState, refreshKey]);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <h1>ChainShield</h1>
          <WalletConnect wallet={wallet} />
        </div>
        <p className="tagline">
          A privacy-first supply chain on <strong>Midnight</strong>. Every product below carries{' '}
          <em>zero-knowledge proven</em> claims — ethical sourcing, certification, fair pricing and a
          verifiable <strong>MANUFACTURED → IN_TRANSIT → DELIVERED</strong> lifecycle — while the
          underlying supplier records stay private.
        </p>
        <p className="privacy-note">Proved without revealing your input.</p>
      </header>

      <ProveActions wallet={wallet} config={netConfig} />

      <section className="panel">
        <div className="panel-head">
          <h2>Public certification ledger</h2>
          <span className="privacy-tag">readable by anyone — private data never leaves the wallet</span>
        </div>
        <label className="field">
          <span>Contract address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Contract ID (from .midnight-state.json / .env)" spellCheck={false} />
        </label>
        <button onClick={() => setRefreshKey((k) => k + 1)} disabled={!address.trim()}>Refresh</button>
        <p className="hint">
          Network: <strong>{netConfig.network}</strong> · Indexer: <code>{netConfig.indexerUrl}</code>
        </p>
        {load.status === 'loading' && <p className="muted">Decoding on-chain state…</p>}
        {load.status === 'error' && <p className="error">Failed to read state: {load.message}</p>}
        {load.status === 'empty' && <p className="muted">Enter a deployed contract address above, or run <code>npm run setup</code> first.</p>}
        {load.status === 'ready' && load.ledger.products.length === 0 && (
          <p className="muted">Contract is deployed but no products are registered yet.</p>
        )}
        {load.status === 'ready' && load.ledger.products.length > 0 && (
          <>
            <Stats products={load.ledger.products} />
            <LedgerOverview products={load.ledger.products} />
            <div className="products">
              {load.ledger.products.map((p) => <ProductRow key={p.productId} product={p} />)}
            </div>
            <p className="hint">Company authority key: <code>{load.ledger.authority}</code></p>
          </>
        )}
      </section>

      <ConsumerVerify products={load.status === 'ready' ? load.ledger.products : []} />

      <section className="panel privacy">
        <div className="panel-head">
          <h2>How privacy works</h2>
          <span className="privacy-tag">selective disclosure</span>
        </div>
        <p>Instead of revealing the fact, ChainShield publishes a <strong>proof of the fact</strong>:</p>
        <ul className="zk-examples">
          <li><span className="reveal">Supplier: ABC Cotton Ltd · Maharashtra · ₹12,50,000</span> → <strong>✓ Supplier is government certified</strong></li>
          <li><span className="reveal">Transport temperature: 3.4°C</span> → <strong>✓ Temperature remained within the required range</strong></li>
          <li><span className="reveal">Factory: XYZ Manufacturing</span> → <strong>✓ Product manufactured by an approved facility</strong></li>
        </ul>
        <p>Only the following cross the proof boundary:</p>
        <ul>
          <li>Claim booleans, the <code>certifiedCount</code> aggregate, the committed <code>fairFloor</code></li>
          <li>Lifecycle stage, <code>auditCount</code>, derived compliance score</li>
        </ul>
        <p className="muted">Supplier identities, certificates + expiries, prices paid and routes never leave the wallet — they are generated at proof time, used for the zero-knowledge proof, and dropped.</p>
      </section>
    </div>
  );
}