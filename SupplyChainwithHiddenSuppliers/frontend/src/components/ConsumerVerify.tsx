/**
 * ConsumerVerify — the QR-code consumer-verification panel.
 *
 * A consumer pastes / scans a product ID and gets back only the ZERO-KNOWLEDGE
 * *proven* statements — exactly what the ChainShield QR flow does in retail.
 * It never shows supplier identities, prices or routes.
 */
import { useMemo, useState } from 'react';
import type { ProductClaim } from '../api';
import { VerifierStatements } from './VerifierStatements';

export function ConsumerVerify({ products }: { products: ProductClaim[] }) {
  const [q, setQ] = useState('');
  const found = useMemo(
    () => products.find((p) => p.productId.toLowerCase() === q.trim().toLowerCase()),
    [products, q],
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>
          <span className="panel-kicker">QR flow</span>
          Consumer verification
        </h2>
        <span className="privacy-tag">Proved without revealing your input</span>
      </div>
      <p className="muted">
        A consumer scans the pack QR and sees <em>only</em> these proven statements — never the
        supplier identities, prices or routes behind them.
      </p>
      <div className="verify-search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. PROD-CHAINSHIELD-01"
          spellCheck={false}
          aria-label="Product ID to verify"
        />
      </div>
      {q.trim() && !found && <p className="error">No product matches "{q}".</p>}
      {q.trim() && found && (
        <div className="verify-result" key={found.productId}>
          <div className="verify-meta">
            <strong>{found.productId}</strong>
            <span className="muted">batch {found.batchId} · {found.quantity.toString()} units</span>
            <span className="badge badge-stage">{stageLabel(found.stage)}</span>
          </div>
          <VerifierStatements product={found} />
        </div>
      )}
    </div>
  );
}

function stageLabel(stage: number): string {
  return { 1: 'MANUFACTURED', 2: 'IN_TRANSIT', 3: 'DELIVERED' }[stage] ?? 'UNKNOWN';
}