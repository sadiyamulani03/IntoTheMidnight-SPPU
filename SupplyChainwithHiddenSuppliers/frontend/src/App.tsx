import { useCallback, useEffect, useState } from 'react';
import { fetchPublicState, CLAIM_LABELS, STAGES, type ProductClaim, type PublicLedger } from './api';
import { getConfig, networkLabel } from './lib/networks';
import { useMidnight } from './hooks/useMidnight';
import { WalletConnect } from './components/WalletConnect';
import { ProveActions } from './components/ProveActions';

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
  return (
    <div className="product-card">
      <div className="product-header">
        <span className="product-id">{product.productId}</span>
        <span className="audits">re-audits on chain: {product.auditCount}</span>
      </div>
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
        <label className="field">
          <span>Contract address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Contract ID (from .midnight-state.json / .env)" spellCheck={false} />
        </label>
        <button onClick={() => setRefreshKey((k) => k + 1)} disabled={!address.trim()}>Refresh</button>
        <p className="hint">
          Network: <strong>{netConfig.network}</strong> · Indexer: <code>{netConfig.indexerUrl}</code>
        </p>
      </section>

      <section className="panel">
        <h2>Public certification ledger</h2>
        {load.status === 'loading' && <p className="muted">Decoding on-chain state…</p>}
        {load.status === 'empty' && <p className="muted">Enter a deployed contract address above, or run <code>npm run setup</code> first.</p>}
        {load.status === 'error' && <p className="error">Failed to read state: {load.message}</p>}
        {load.status === 'ready' && (
          <>
            {load.ledger.products.length === 0
              ? <p className="muted">Contract is deployed but no products are registered yet.</p>
              : (<> <Stats products={load.ledger.products} /> <div className="products"> {load.ledger.products.map((p) => <ProductRow key={p.productId} product={p} />)} </div> </>)}
            <p className="hint">Company authority key: <code>{load.ledger.authority}</code></p>
          </>
        )}
      </section>

      <section className="panel privacy">
        <h2>What stays private</h2>
        <ul>
          <li>Supplier identities (only a <code>certifiedCount</code> aggregate is revealed)</li>
          <li>Individual certificates and their expiry dates</li>
          <li>The prices actually paid to each supplier</li>
          <li>The logistics routes used</li>
        </ul>
        <p>
          Only claims cross the proof boundary: the claim booleans, the certified count, the fair floor,
          the stage and a derived compliance score. To publish one, connect a Midnight wallet on{' '}
          <strong>{networkLabel(netConfig.network)}</strong> and use <em>Prove &amp; publish</em> above — the
          proof is generated without ever revealing the private supplier list.
        </p>
      </section>
    </div>
  );
}