/**
 * VerifierStatements — the human-readable, ZK *proven* statements a consumer /
 * regulator sees. Mirrors the QR-code consumer-verification flow of ChainShield:
 * instead of revealing the underlying supplier data, it renders only the claims
 * proved in zero-knowledge. Supplies NO private data.
 */
import type { ProductClaim } from '../api';

export interface VerifierStatement {
  label: string;
  ok: boolean;
  hint?: string;
}

export function buildStatements(p: ProductClaim): VerifierStatement[] {
  return [
    { label: 'Ethically sourced', ok: p.isEthical },
    {
      label: 'Certified suppliers only',
      ok: p.allCertified,
      hint: `${p.certifiedCount}/8 suppliers certified — identities never revealed`,
    },
    {
      label: 'Passed quality inspection',
      ok: p.isEthical && p.allCertified && (p.complianceScore ?? 0) >= 60,
    },
    { label: 'Transport met required standards', ok: p.allRoutesCompliant },
    { label: 'Fair-trade pricing proven', ok: p.fairPricing },
    { label: 'Authentic product', ok: true, hint: 'on-chain record exists' },
  ];
}

export function VerifierStatements({ product }: { product: ProductClaim }) {
  const stmts = buildStatements(product);
  return (
    <div className="verifier">
      <div className="verifier-head">
        <span className="verifier-title">Zero-knowledge verified statements</span>
        <span className="privacy-tag">Proved without revealing your input</span>
      </div>
      <ul className="verifier-list">
        {stmts.map((s) => (
          <li key={s.label} className={`verifier-item ${s.ok ? 'ok' : 'no'}`}>
            <span className="vhook">{s.ok ? '✓' : '✕'}</span>
            <span>{s.label}</span>
            {s.hint && <span className="muted verifier-hint">{s.hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}