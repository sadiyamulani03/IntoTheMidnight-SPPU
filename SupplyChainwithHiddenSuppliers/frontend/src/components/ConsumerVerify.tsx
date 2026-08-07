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
        <h2>Consumer verification</h2>
        <span className="privacy-tag">QR flow — Proved without revealing your input</span>
      </div>
      <p className="muted">
        Enter a product ID to see the verified statements a consumer gets when scanning
        the product QR code. Only proven claims are shown — supplier identities, prices
        and routes stay private.
      </p>
      <div className="verify-search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. PROD-CHAINSHIELD-01"
          spellCheck={false}
        />
        {q.trim() && !found && <p className="error">No product matches "{q}".</p>}
      </div>
      {found && (
        <div className="verify-result">
          <div className="verify-meta">
            <strong>{found.productId}</strong>
            <span className="muted">batch {found.batchId} · quantity {found.quantity.toString()}</span>
            <span className={`badge badge-stage stage-${found.stage}`}>{STAGES[found.stage]}</span>
          </div>
          <VerifierStatements product={found} />
        </div>
      )}
    </div>
  );
}

const STAGES: Record<number, string> = { 1: 'MANUFACTURED', 2: 'IN_TRANSIT', 3: 'DELIVERED' };