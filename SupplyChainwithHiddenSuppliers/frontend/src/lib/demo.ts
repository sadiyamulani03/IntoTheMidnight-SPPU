/**
 * demo.ts — seeded demo ledger + simulated prove flow for judges.
 *
 * When `VITE_DEMO_MODE=true` and no contract address is configured, the
 * dashboard renders this realistic ledger instead of hitting a chain. The data
 * is anchored in a concrete vertical (single-origin coffee) so the privacy
 * story is tangible. Nothing here touches a chain, a wallet, or a relay.
 */
import type { ProductClaim, PublicLedger } from '../api';

export const DEMO_AUTHORITY =
  '9c78b3a1e47ec8f46be5905d970f238b3d2881ffb1d76104f672b2cb1e458f72';

export function demoLedger(): PublicLedger {
  const products: ProductClaim[] = [
    {
      productId: 'COFFEE-KIGALI-001',
      batchId: 'RW-2026-BATCH-04',
      quantity: 2500n,
      stage: 3,
      isEthical: true,
      allCertified: true,
      certifiedCount: 8,
      allRoutesCompliant: true,
      fairFloor: 120n,
      fairPricing: true,
      auditCount: 3,
      complianceScore: 100,
    },
    {
      productId: 'COFFEE-HUILA-002',
      batchId: 'CO-2026-BATCH-11',
      quantity: 1200n,
      stage: 2,
      isEthical: true,
      allCertified: true,
      certifiedCount: 8,
      allRoutesCompliant: true,
      fairFloor: 130n,
      fairPricing: true,
      auditCount: 1,
      complianceScore: 100,
    },
    {
      productId: 'COFFEE-SIDAMO-003',
      batchId: 'ET-2026-BATCH-02',
      quantity: 3200n,
      stage: 1,
      isEthical: true,
      allCertified: true,
      certifiedCount: 8,
      allRoutesCompliant: true,
      fairFloor: 0n,
      fairPricing: false,
      auditCount: 0,
      complianceScore: 80,
    },
  ];
  return { products, authority: DEMO_AUTHORITY, rawState: 'demo-seed' };
}

export interface DemoProofEvent {
  at: string;
  circuit: string;
  summary: string;
  productId: string;
}

/** A tiny simulated "proof history" timeline for one product. */
export function demoProofHistory(productId: string): DemoProofEvent[] {
  const byProduct: Record<string, DemoProofEvent[]> = {
    'COFFEE-KIGALI-001': [
      { at: '2026-02-10T09:00', circuit: 'registerProduct', summary: 'Registered — 8/8 suppliers certified, ethically sourced, routes compliant', productId },
      { at: '2026-03-02T10:30', circuit: 'recertifyProduct', summary: 'Re-audit #1 — all certificates re-verified before expiry threshold', productId },
      { at: '2026-04-18T08:15', circuit: 'proveFairPricing', summary: 'Fair pricing proven — every supplier paid ≥ 120 fair-trade floor', productId },
      { at: '2026-05-27T14:00', circuit: 'shipProduct', summary: 'Shipped — MANUFACTURED → IN_TRANSIT, all routes compliant', productId },
      { at: '2026-06-30T11:45', circuit: 'recertifyProduct', summary: 'Re-audit #3 — lifecycle, certificates current', productId },
      { at: '2026-07-12T16:20', circuit: 'deliverProduct', summary: 'Delivered — 2,500 units IN_TRANSIT → DELIVERED', productId },
    ],
    'COFFEE-HUILA-002': [
      { at: '2026-04-22T09:00', circuit: 'registerProduct', summary: 'Registered — 8/8 suppliers certified, ethically sourced', productId },
      { at: '2026-06-09T12:10', circuit: 'recertifyProduct', summary: 'Re-audit #1 — certificates re-verified', productId },
      { at: '2026-07-19T10:05', circuit: 'shipProduct', summary: 'Shipped — MANUFACTURED → IN_TRANSIT', productId },
    ],
    'COFFEE-SIDAMO-003': [
      { at: '2026-07-01T09:00', circuit: 'registerProduct', summary: 'Registered — 8/8 suppliers certified, ethically sourced', productId },
    ],
  };
  return byProduct[productId] ?? [];
}
