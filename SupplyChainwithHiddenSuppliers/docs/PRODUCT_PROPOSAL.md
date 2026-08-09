# Product Proposal — Confidential Credentials for Ethical Supply Chains

**Submission for: Level 3 — First Quarter, INTO the Midnight (SPPU bootcamp)**

- **Chosen problem (from the provided list):** *Confidential Credentials — prove
  a credential is valid without disclosing it.*
- **Repo:** https://github.com/sadiyamulani03/IntoTheMidnight-SPPU (`SupplyChainwithHiddenSuppliers/`)
- **Live demo:** GitHub Pages dashboard decoding the deployed contract's public state
- **Status:** Proposed for approval

---

## 1. Problem statement

A consumer-goods company wants to publish credible claims about its supply
chain — *"this product is ethically sourced", "every supplier behind it is
certified", "every logistics route is compliant", "every supplier is paid at
least a fair-trade floor"* — without handing competitors a map of its
sourcing: supplier identities, certificate numbers, actual prices paid and
route corridors.

This is exactly the **Confidential Credentials** pattern: a set of credentials
(supplier certifications, ethical-sourcing attestations, route approvals)
that a verifier must be sure exist and are currently valid, while the
credential holder and every identifying field stay hidden. Public ledgers
today force a false choice — disclose everything, or claim without proof.
Midnight lets us **prove the claims and hide the credentials**.

## 2. Product concept

**Confidential Credentials for Ethical Supply Chains** is a Midnight dApp that
lets a company publish *zero-knowledge-proven* certification claims about each
product, and track each product through a verifiable lifecycle
(**MANUFACTURED → IN_TRANSIT → DELIVERED**), while the supplier records that
ground the proofs never leave the wallet.

| Public (proven on chain)                                  | Private (proved in ZK, then dropped)                    |
| --------------------------------------------------------- | ------------------------------------------------------- |
| product / batch ID, committed quantity                    | supplier identities (only an aggregate `certifiedCount`) |
| lifecycle stage and a derived 0–100 compliance score      | individual certificates and expiry dates                 |
| claim booleans: `isEthical`, `allCertified`, `fairPricing`| prices actually paid per supplier                        |
| committed fair-trade floor                                | logistics routes                                        |
| audit trail: `auditCount` of on-chain re-verifications    | the company's secret signing key                        |
| the company's derived public `authority` key              |                                                         |

A third-party auditor, regulator or consumer can read the full ledger and
verify every claim on-chain — and a full index of the chain still reveals
**nothing** supplier-specific. This is *selective disclosure by design*.

## 3. Users & use cases

- **Company / credential holder** — runs the CLI to register products, prove
  claims, ship and deliver. The supplier list is private witness data, only
  ever used to build proofs.
- **Regulator / auditor / buyer / consumer** — opens the read-only dashboard
  (or queries the indexer) to verify claims, lifecycle stage and compliance
  score without needing any private data or a wallet.
- **Fair-trade / certification bodies** — the `recertifyProduct` circuit
  enforces a certificate-expiry policy (`certExpiry ≥ minExpiry`) on-chain,
  so stale credentials cannot be re-proven.

## 4. Why Midnight

- **Selective disclosure is native.** The Compact contract wraps every public
  value in `disclose(...)`; everything else exists only inside the proving
  wallet and is dropped after proof generation.
- **Privacy-preserving audits.** `recertifyProduct` re-proves a *fresh* private
  supplier list against a public policy threshold — no credential data ever
  reaches the chain.
- **ZK-authenticated ownership.** `withdrawClaim` proves ownership from the
  secret key using a derived, domain-separated public key, so even the
  authority relation does not leak the wallet's on-chain identity.

## 5. Architecture

- `contracts/supply-chain.compact` — 6 circuits:
  `registerProduct`, `recertifyProduct`, `proveFairPricing`, `shipProduct`,
  `deliverProduct`, `withdrawClaim`.
- `src/` — deploy/setup, interactive CLI, private supplier witness builders,
  key derivation, shared providers.
- `frontend/` — Vite + React public claims dashboard (indexer-backed, read-only).
- `tests/` — 38 offline unit tests + 5 frontend tests; `scripts/e2e-check.ts`
  walks the full on-chain lifecycle.
- **CI/CD** — GitHub Actions compiles the contract, typechecks and runs both
  test suites on every push; a second workflow deploys the dashboard to GitHub
  Pages as a live demo.

## 6. Verification

- Minimum 3 tests passing: **43 tests pass** (38 backend + 5 frontend) in CI.
- End-to-end: a full lifecycle (register → recertify → fair pricing → ship →
  deliver → withdraw) runs against a deployed contract with real ZK proofs.
- CI/CD badge in the README points at passing workflow runs.

## 7. Roadmap

- [x] Contract with 6 circuits + privacy model
- [x] Deploy + CLI + full on-chain lifecycle e2e
- [x] Public claims dashboard with lifecycle timeline & compliance score
- [x] Offline tests (backend + frontend)
- [x] CI/CD (compile + test on push) and GitHub Pages live dashboard
- [ ] In-wallet (browser) company console for register/ship/deliver
- [ ] Email/alert notifications when re-certification is due
- [ ] Multi-company deployments with per-company authority

## 8. Success metrics

- A third party can verify all claims of any product in one page view.
- Proof generation is the only step that touches private data; no private
  field is ever written to the ledger.
- A malicious claim (answer any sourcing question with `n`) always fails to
  prove — claims cannot be faked.
