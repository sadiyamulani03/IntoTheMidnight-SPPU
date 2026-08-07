/**
 * LedgerOverview — aggregate health of the public certification ledger.
 * Everything here is derived from PUBLIC claims only; no private data.
 */
import type { ProductClaim } from '../api';

export function LedgerOverview({ products }: { products: ProductClaim[] }) {
  const total = products.length;
  if (total === 0) return null;

  const scores = products.map((p) => p.complianceScore ?? 0);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
  const buckets = [
    { label: '100 — fully compliant', from: 100, to: 100 },
    { label: '60–99 — compliant', from: 60, to: 99 },
    { label: '0–59 — needs action', from: 0, to: 59 },
  ].map((b) => ({
    ...b,
    count: products.filter((p) => (p.complianceScore ?? 0) >= b.from && (p.complianceScore ?? 0) <= b.to).length,
  }));

  const certified = products.filter((p) => p.allCertified).length;
  const fairPaid = products.filter((p) => p.fairPricing).length;
  const delivered = products.filter((p) => p.stage >= 3).length;

  return (
    <div className="overview">
      <div className="overview-stat">
        <span className="stat-num">{avg}</span>
        <span className="stat-label">avg compliance score</span>
      </div>
      <div className="overview-stat">
        <span className="stat-num">{certified}/{total}</span>
        <span className="stat-label">all suppliers certified</span>
      </div>
      <div className="overview-stat">
        <span className="stat-num">{fairPaid}/{total}</span>
        <span className="stat-label">fair-pricing proven</span>
      </div>
      <div className="overview-stat">
        <span className="stat-num">{delivered}/{total}</span>
        <span className="stat-label">delivered</span>
      </div>
      <div className="overview-dist">
        {buckets.map((b) => (
          <div key={b.label} className="dist-row">
            <span className="muted dist-label">{b.label}</span>
            <div className="dist-track">
              <div
                className={`dist-fill ${b.count > 0 ? 'on' : ''}`}
                style={{ width: `${total ? Math.round((b.count / total) * 100) : 0}%` }}
              />
            </div>
            <span className="muted">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}