# ChainShield — Privacy-Preserving Ethical Supply Chain on Midnight

ChainShield lets companies prove their products are **authentic, ethically
sourced, and fully compliant** on the [Midnight Network](https://midnight.network)
— using Zero-Knowledge Proofs so that **supplier identities, prices, contracts
and logistics routes never leave the company**.

> Every product is proven to be **ethically sourced**, backed only by
> **certified** suppliers, shipped over **compliant routes**, paid at a
> **fair-trade floor**, and tracked through a verifiable lifecycle
> (**MANUFACTURED → IN_TRANSIT → DELIVERED**) — while the supplier records behind
> those claims stay private.

## 🔗 Live Demo

- **Live dashboard:** https://chainshield-supply-chain.vercel.app
- **Contract (Midnight Preview):** `4c55c8b1e47ec8f46be5905d970f238b3d2881ffb1d76104f672b2cb1e458f72`

## Project Vision

Traditional supply chains demand proof — that products are ethically sourced,
free of child or forced labour, produced by certified factories, and transported
within required standards. But today that means revealing sensitive commercial
secrets: supplier names, factory locations, pricing agreements, and shipping
routes.

ChainShield's vision is a supply chain where **transparency and privacy coexist**.
Companies publish a public ledger of *claims* (every supplier certified, every
route compliant, every price fair) and generate zero-knowledge proofs that those
claims are true — without ever publishing *who* the suppliers are, *how much* was
paid, or *where* goods moved. Midnight is the core of this because its Compact
smart contracts run exactly this kind of selective disclosure natively: the
ledger holds only the disclosed booleans, counts and a committed price floor,
while the witness data that backs them (identities, certificates, prices, routes)
is proved in zero-knowledge and then dropped. Consumers, regulators and retailers
verify the *proof*; businesses keep their *secrets*.

## Smart Contract Deployment

- **Network:** local devnet (`undeployed` preset — `docker compose up -d`), and
  **Preview** for the public path
- **Deployed contract ID (devnet):**
  `79c95c38c36c23a4c7bba815ee8ee4c6e7c242dbccce73f2749176481cc331c8`
- **Deployed contract ID (Preview):**
  `4c55c8b1e47ec8f46be5905d970f238b3d2881ffb1d76104f672b2cb1e458f72`
  (deployed from `mn_addr_preview1md72t23x5c2wxekztp5g9vxm36wung3x7y8pn2dsrw7r9gl0g6hssevm36`, August 8 2026)
- **Live dashboard (Vercel):** https://chainshield-supply-chain.vercel.app
  — reads the public claims of the Preview contract straight from the
  Midnight indexer (Vite env: `VITE_NETWORK=preview`,
  `VITE_INDEXER_URL=https://indexer.preview.midnight.network`,
  `VITE_CONTRACT_ADDRESS=4c55c8b1e47ec8f46be5905d970f238b3d2881ffb1d76104f672b2cb1e458f72`).
  The hosted build is read-only (`VITE_ENABLE_PROVE=false`); the *Prove & publish*
  ZK panel runs locally via the relay / wallet extension.

### What an on-chain observer sees

| Goes **on chain** (public)                                  | Stays **private** (proved in ZK, then dropped)            |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| product ID                                                  | supplier identities (only a `certifiedCount` is revealed) |
| `batchId` and `quantity` metadata                           | individual certificates + expiry dates                    |
| `stage` (1 = MANUFACTURED · 2 = IN_TRANSIT · 3 = DELIVERED) | prices actually paid to each supplier                    |
| claim booleans: `isEthical`, `allCertified`, `fairPricing`  | logistics routes                                          |
| `certifiedCount` (aggregate — count only)                   | the company's secret key (`companySecretKey` witness)     |
| public `fairFloor` committed by the company                 |                                                           |
| `auditCount` (re-verifications on chain)                    |                                                           |
| `complianceScore` (derived 0–100 health score)              |                                                           |
| the company's derived public key (`authority`)              |                                                           |

Every circuit folds over a private `Vector<8, Supplier>` (identity hash,
certification state, expiry, price paid, route compliance) and `disclose()`s
only the aggregated claims. A full index of the chain reveals claims — never the
commercial secrets behind them. `tests/privacy.test.ts` enforces this
structurally: the compiled public `Ledger` type cannot carry any private supplier
field, while the circuit input type proves those fields are real witnesses.

### Compliance score — auditable, not cosmetic

The `complianceScore` (0–100) is a **pure function of public claims**, computed
inside the circuit (`scoreOf`) so the number is as unforgeable as the claims
themselves:

| Weight | Condition                                              |
| ------ | ------------------------------------------------------ |
| 30     | every supplier is certified (`allCertified`)           |
| 30     | ethically sourced (`isEthical`)                        |
| 20     | every logistics route compliant (`allRoutesCompliant`) |
| 20     | fair pricing proven (`fairPricing`)                    |

```text
score = (allCertified ? 30 : 0) + (isEthical ? 30 : 0)
      + (allRoutesCompliant ? 20 : 0) + (fairPricing ? 20 : 0)
```

The formula is part of the contract source (`contracts/supply-chain.compact`,
`scoreOf`) and is compiled into the public circuit — anyone can verify the score
from the four public booleans without trusting ChainShield. **Certificate
decay:** `certExpiry` is a private witness; a *lapsed* certificate cannot be
attested, so a product cannot ship, deliver or re-verify once any supplier's
cert expires (`recertifyProduct` enforces `certExpiry ≥ minExpiry`). The public
`auditCount` records how often claims were re-verified, giving a visible
recency signal. *A time-based decay of the score itself is planned — see
"Future Scope".*

### Threat model — what an attacker can and cannot infer

| Threat                              | Mitigation in ChainShield                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Relay compromise**                | The relay accepts **only public claim flags** — private witness values (`pricePaid`, `certExpiry`, identities) are derived inside the process, never accepted from the client, never logged, and buffer-zeroed after proving (`wipeSuppliers`). Worst case a compromised relay attests false claims it *itself* fabricates — it cannot exfiltrate data it never holds. |
| **Malicious indexer / RPC**         | A hostile indexer sees only public `Ledger` state — booleans, `certifiedCount`, `fairFloor`, stage, timestamps. It cannot see identities, prices, routes or certificates, and the ZK proof itself proves the claims without revealing witnesses. |
| **Timing/metadata side channel**    | The number and cadence of `register/ship/deliver` transactions is public by design on any ledger. Data *content* stays hidden; **volume/frequency** is not yet obfuscated. See "Future Scope" (commit-reveal + batching). |
| **Fake claims (self-attestation)**  | Circuits are **fail-closed**: a proof asserting `certified=false`, an expired cert, an out-of-range price, a skipped stage (`DELIVERED` without `IN_TRANSIT`) or an unregistered product **fails** — enforced by `assert` gates, covered by `tests/adversarial.test.ts`. Today the supplier list is **self-attested**; third-party signed certificates are the roadmap priority ("Future Scope"). |
| **Replay / tampered proof**         | Each claim is committed to the ledger; transitions require the exact prior `stage` (state machine), so a replayed or out-of-order proof cannot move a product out of sequence. |

The relay privacy boundary and the fail-closed circuit gates are enforced
automatically in `tests/adversarial.test.ts` (structural, deterministic).

## Key Features

- **Six privacy-first Compact circuits** (`contracts/supply-chain.compact`):
  `registerProduct`, `recertifyProduct`, `proveFairPricing`, `shipProduct`,
  `deliverProduct`, `withdrawClaim` (owner-authenticated via a private key
  witness — the key itself is never revealed).
- **Zero-Knowledge selective disclosure** — public claims + a certified-supplier
  *count* and a committed fair-trade *floor* are all that cross the proof
  boundary; identities, prices and routes never do. Each claim is wrapped in
  `disclose()` at the point of use, never the private data.
- **Lifecycle tracking** — MANUFACTURED → IN_TRANSIT → DELIVERED with re-audits
  (`auditCount`) and a derived **compliance score (0–100)**. Lapsed certificates
  or non-compliant routes cannot ship/deliver.
- **Fail-closed assertions** — answer any sourcing question with `n` and the
  proof simply fails; claims cannot be faked.
- **DApp Connector wallet (Preview)** — `useMidnight` discovers
  `window.midnight`, never hardcodes a wallet name, validates the connected
  network, and exposes a WalletConnect UI with proper error states.
- **Indexer-powered public dashboard** — React + Vite dashboard decodes the
  live contract state straight from the Midnight indexer (the exact view a
  regulator/consumer sees).
- **Privacy-labelled prove flow** — every ZK action is tagged
  *"Proved without revealing your input"*; private witnesses are built at
  runtime, used for the proof, and dropped — never rendered, persisted or logged.

## Future Scope

> **Priority #1 — kill self-attestation:** today a company certifies its own
> suppliers. The strongest version replaces that with **third-party certification
> agencies** that cryptographically sign `certificateIssued` claims; the company's
> circuit proves membership of that signed set without revealing which certs it
> holds. Draft contract changes live in `docs/tier2-contract-draft.md`.

- **Certification-agency circuits (Priority #1)** — agencies sign
  `certificateIssued` claims; consumers verify "certified" without learning the
  certificate number.
- **QR-code consumer verification** — a public endpoint that resolves a product
  ID to its proven claims for scanning at point of sale (dashboard already has
  the in-page `ConsumerVerify` panel).
- **Commit-reveal + batching for `ship`/`deliver`** — reduce the timing/frequency
  side channel so business volume doesn't leak even though data content stays
  hidden.
- **Time-based compliance decay** — `complianceScore` currently resets on
  re-verification; a decaying score (weight × `f(age of last audit)`) prevents
  "certify once, coast forever".
- **IoT temperature-compliance circuit** — a new `transportLog` circuit proving
  *"temperature stayed within range"* during cold-chain shipment without
  revealing the readings.
- **Encrypted document storage** — off-chain (encrypted IPFS) for certificates,
  hashed into the on-chain claim.
- **AI-based anomaly detection** — flag suspicious claim trajectories across the
  public ledger (without touching private data).
- **Carbon-footprint and cross-border compliance** proofs.
- **Mainnet path** — redeploy the same contract with a funded wallet on the
  public **Preview**/mainnet networks once the ecosystem matures.

## Tech Stack

- **Blockchain:** Midnight Network
- **Smart contracts:** Compact (`compact compile` → `contracts/managed/`)
- **Privacy:** Zero-Knowledge proofs (supplier vector as witness; `disclose()`-gated)
- **SDK:** Midnight.js (`midnight-js-contracts`, providers, wallet-sdk), compact-runtime
- **Frontend:** React 18 + Vite + TypeScript (DApp Connector wallet, indexer GraphQL)
- **Wallet:** Midnight Wallet browser extension (DApp Connector API, Preview)
- **Infra:** Docker Compose local devnet (node :9944 · indexer :8088 · proof server :6300)
- **Tests:** Vitest

## Local Development

**Judge / reviewer shortcut — demo mode (no wallet, no docker):**

```bash
cd frontend
cp .env.example .env.local       # demo mode is on and needs NO contract address
npm install
npm run dev                       # http://localhost:5173
```

With `VITE_DEMO_MODE=true` and an empty `VITE_CONTRACT_ADDRESS`, the dashboard
renders a seeded single-origin-coffee ledger and every *Prove & publish* is
simulated in-browser (proof history included) — zero funding, zero Preview
wallet, zero proof relay. Any typed claim that would fail on-chain (e.g. the
resulting demo Ledge with a <100 score) is visible immediately. To switch back
to the real chain, set `VITE_CONTRACT_ADDRESS` (demo mode then turns itself
off automatically).

**Full local run (real proofs against the devnet):**

**Requirements:** Node ≥ 22, npm, Docker with Compose, and the Midnight toolchain
(`compact` on PATH or `npx @midnight-ntwrk/compact-toolchain`).

```bash
# 1. Install dependencies
npm install

# 2. Start the local Midnight devnet (node + indexer + proof server)
docker compose up -d --wait
docker compose ps                # all three services healthy

# 3. Compile the Compact contract (0 errors → contracts/managed/)
npm run compile

# 4. Compile-check the TypeScript
npm run build

# 5. Run the offline test suite (67 tests, incl. "private inputs never exposed")
npm run test

# 6. Deploy to the local devnet and record the address in .midnight-state.json
npm run setup                    # or: npm run deploy

# 7. Interact with the contract from the CLI (real proofs on the devnet)
npm run cli                      # 1 register · 2 recertify · 3 fair pricing
                                 # 4 ship · 5 deliver · 6 withdraw · 7 read · 9 exit

# 8. Seed the dashboard with demo products (all lifecycle stages)
npm run register-demo

# 9. Run the public claims dashboard
npm run frontend:dev             # http://localhost:5173
npm run frontend:build           # production build (zero errors)
```

**Local proof relay (recommended, no browser extension needed):** the faster,
privacy-tightest path for the *Prove & publish* flow runs the zero-knowledge
proofs against the local devnet in a Node relay, so the browser never touches
private supplier data — the witness is built server-side and dropped immediately.

```bash
# one terminal: keep the devnet from step 2 running, then
npm run relay                   # http://127.0.0.1:8787
# frontend/.env.local already sets:
#   VITE_ENABLE_PROVE=true
#   VITE_RELAY_URL=http://127.0.0.1:8787
npm run frontend:dev
```

The relay exposes `/health` and `/api/{register,recertify,fair-pricing,ship,deliver,withdraw}`;
requests carry only public claim inputs, and each response returns only the public
transaction id and block. The private supplier witness (`pricePaid`) is generated
inside the relay per proof and dropped after proving.

**Which prover is used in the dashboard:** the *Prove & publish* panel prefers the
local relay whenever it is online, regardless of whether a browser wallet is
connected — most connectors (e.g. **1AM**) do **not** expose a
`getMidnightProviders` adapter, and the relay runs the same wallet + contract
stack as the CLI. The in-browser connector prover is only used when the connected
wallet explicitly hands back a providers adapter. If the relay is offline and no
browser prover exists, the panel explains how to start it (`npm run relay`).

**Deploy to the public Preview network** (requires a funded wallet):

```bash
npm run deploy -- --network preview
# fund the printed wallet address at the Preview faucet, wait for tNIGHT,
# then re-run. The contract ID is recorded in .midnight-state.json and can be
# copied into frontend/.env.local as VITE_CONTRACT_ADDRESS.
```

**Hosting the dashboard (Vercel/Netlify):**

The frontend is self-contained — it bundles the compiled contract
(`frontend/src/contracts/`) and its ZK assets (`frontend/public/managed/`) so a
static host never needs the Compact toolchain or Midnight node. `frontend/.env.production`
carries the live Preview config. Deploy the `frontend/` directory (`vercel.json`
and `netlify.toml` are both included):

```bash
npx vercel --prod --cwd frontend
npm run frontend:build        # equivalent production build, baked via Vite
```

**Wallet integration (Preview dashboard):** install the Midnight Wallet browser
extension, fund it on **Preview**, set `VITE_NETWORK=preview` and
`VITE_ENABLE_PROVE=true` in `frontend/.env.local`, then use *Prove & publish* in
the dashboard. If your wallet variant names its provider adapter differently
from `getMidnightProviders()` (see `frontend/src/hooks/useMidnight.ts`), adjust
that single call site — everything else is wired.

### Troubleshooting

- **`expected instance of StateValue` on contract calls** — the Midnight.js /
  compact-runtime WASM runtime is duplicated. Run `npm dedupe` (see README note
  on the `onchain-runtime-v3` override).
- **`Not enough Dust` during deploy** — the script auto-waits; ensure the proof
  server is up (`docker compose ps`).
- **RPC disconnection logs during sync** — expected on devnet restarts; ignored.

## Project structure

```
contracts/supply-chain.compact     The Compact contract (public/private split + 6 circuits)
contracts/managed/                 Generated by `compact compile` (gitignored)
src/                               Deploy / CLI / network / wallet / providers (Node)
tests/                             Vitest suite incl. privacy (never-exposed) tests
frontend/                          React + Vite dashboard (DApp Connector + indexer reads)
compose.yml                        Local Midnight devnet stack
docs/                              Architecture · Tier 2 draft · eval sheet · video storyboard
```

## Companion docs

| Doc                                              | Use when                               |
| ------------------------------------------------ | -------------------------------------- |
| `SupplyChainwithHiddenSuppliers/docs/architecture.md`          | Mermaid diagrams + threat boundary       |
| `SupplyChainwithHiddenSuppliers/docs/eval-sheet.md`            | 60-second demo walkthrough for judges    |
| `SupplyChainwithHiddenSuppliers/docs/demo-video-storyboard.md` | Recording the demo video                 |
| `SupplyChainwithHiddenSuppliers/docs/tier2-contract-draft.md`  | Next-contract spec (agencies + QR)       |
