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
- **Preview:** `[PENDING — requires a funded Midnight Wallet. Run:
  npm run deploy -- --network preview]` (fund the deployer address at the
  Preview faucet, then the frontend connects to the contract via
  `VITE_CONTRACT_ADDRESS`).

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

- **IoT temperature-compliance circuit** — a new `transportLog` circuit proving
  *"temperature stayed within range"* during cold-chain shipment without
  revealing the readings.
- **Certification-agency circuits** — agencies sign `certificateIssued` claims;
  consumers verify "certified" without learning the certificate number.
- **Encrypted document storage** — off-chain (encrypted IPFS) for certificates,
  hashed into the on-chain claim.
- **QR-code consumer verification** — a public endpoint that resolves a product
  ID to its proven claims for scanning at point of sale.
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

# 5. Run the offline test suite (52 tests, incl. "private inputs never exposed")
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

**Deploy to the public Preview network** (requires a funded wallet):

```bash
npm run deploy -- --network preview
# fund the printed wallet address at the Preview faucet, wait for tNIGHT,
# then re-run. The contract ID is recorded in .midnight-state.json and can be
# copied into frontend/.env.local as VITE_CONTRACT_ADDRESS.
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
```

## License

MIT
