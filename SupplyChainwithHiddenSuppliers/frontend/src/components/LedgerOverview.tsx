/**
 * LedgerOverview — aggregate health of the public certification ledger as a
 * KPI dashboard: average compliance ring + compliance band distribution.
 * Everything here is derived from PUBLIC claims only; no private data.
 */
import type { ProductClaim } from '../api';

export function LedgerOverview({ products }: { products: ProductClaim[] }) {
  const total = products.length;
  if (total === 0) return null;

  const scores = products.map((p) => p.complianceScore ?? 0);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);

  const buckets = [
    { label: '100 / fully compliant', from: 100, to: 100, tone: 'green' },
    { label: '60–99 / compliant', from: 60, to: 99, tone: 'warn' },
    { label: '0–59 / needs action', from: 0, to: 59, tone: 'no' },
  ].map((b) => ({
    ...b,
    count: products.filter((p) => (p.complianceScore ?? 0) >= b.from && (p.complianceScore ?? 0) <= b.to).length,
  }));

  const circumference = 2 * Math.PI * 46;

  return (
    <div className="overview-grid">
      <div className="gauge-ring" title={`Average compliance score: ${avg}/100`}>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="55"
            cy="55"
            r="46"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(avg, 100) / 100)}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3ddc97" />
              <stop offset="60%" stopColor="#8b7bff" />
              <stop offset="100%" stopColor="#c96bff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="gauge-num">{avg}</div>
      </div>

      <div className="score-chart">
        {buckets.map((b) => (
          <div key={b.label} className="dist-row">
            <span className="dist-label">{b.label}</span>
            <div className="dist-track">
              <div
                className={`dist-fill ${b.tone}`}
                style={{ width: `${total ? Math.round((b.count / total) * 100) : 0}%` }}
              />
            </div>
            <span className="dist-count">{b.count}</span>
          </div>
        ))}
        <p className="muted" style={{ fontSize: 12, margin: '4px 0 0' }}>
          Compliance score = 30 all-certified + 30 ethical + 20 routes + 20 fair-pricing.
        </p>
      </div>
    </div>
  );
}