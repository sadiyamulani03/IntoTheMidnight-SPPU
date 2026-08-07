# Supply Chain with Hidden Suppliers

A [Midnight Network](https://midnight.network) zero-knowledge dApp that lets a
company **prove** its supply chain is ethical — without revealing the
suppliers behind it.

> Every product is proven to be **ethically sourced**, backed only by
> **certified** suppliers, shipped over **compliant routes**, paid at a
> **fair-trade floor**, and tracked through a verifiable lifecycle
> (**MANUFACTURED → IN_TRANSIT → DELIVERED**) — all while supplier identities,
> certificates, prices and routes stay private.

## The privacy model

The Compact contract `contracts/supply-chain.compact` splits data into two
worlds:

| Goes **on chain** (public)                                  | Stays **private** (proved in ZK, then dropped)            |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| product ID                                                  | supplier identities (only a `certifiedCount` is revealed) |
| `batchId` and `quantity` metadata                           | individual certificates + expiry dates                    |
| `stage` (1 = MANUFACTURED · 2 = IN_TRANSIT · 3 = DELIVERED) | prices actually paid to each supplier                    |
| claim booleans: `isEthical`, `allCertified`, `fairPricing`  | logistics routes                                          |
| `certifiedCount` (aggregate — count only)                   | the company's secret key                                  |
| public `fairFloor` committed by the company                 |                                                           |
| `auditCount` (how many re-verifications)                    |                                                           |
| `complianceScore` (derived 0–100 health score)              |                                                           |
| the company's derived public key (`authority`)              |                                                           |

Every circuit folds over a private `Vector<8, Supplier>` (identity hash,
certification state, expiry, price paid, route compliance) and discloses only
the aggregated claims. Nothing supplier-specific is written to the ledger, so a
full index of the chain reveals claims — but never the commercial secrets
behind them.

## Architecture

```
contracts/supply-chain.compact        Compact smart contract (the ZK logic)
src/contract.ts                       Compiled-contract binding (witness + assets)
src/deploy.ts                         Deploys the contract to a Midnight network
src/cli.ts                            Interactive CLI (registers/audits/ships products)
src/network.ts                        Network selection, seeds, deployment records
src/wallet.ts                         Wallet creation + sync (midnight SDK)
src/providers.ts                      Shared SDK provider wiring
src/keys.ts                           Deterministic company authority key
src/suppliers.ts                      Private supplier witness builders
src/setup.ts                          One-shot bootstrap: compile → deploy → save
scripts/e2e-check.ts                  Full end-to-end smoke check (all 6 circuits)
scripts/register-demo.ts              Seeds the dashboard with demo products
frontend/                             Public claims dashboard (Vite + React)
tests/                                Offline unit tests (vitest)
compose.yml                           Local Midnight devnet (node + indexer + prover)
```

## Requirements

- Node.js ≥ 22, npm
- Docker with Docker Compose (for the local devnet and proof server)
- The Compact toolchain is invoked via `npx @midnight-ntwrk/compact-toolchain` by `npm run compile`

## Quickstart (local devnet)

```bash
npm install

# 1. Start the local Midnight devnet (node, indexer, proof server)
docker compose up -d --wait
docker compose ps        # all three services healthy

# 2. Compile the Compact contract
npm run compile

# 3. Generate the wallet, sync, and deploy (auto-waits for funds/DUST)
npm run setup
```

`npm run setup` runs end to end non-interactively and records the deployed
contract address in `.midnight-state.json`.

## Interact

```bash
npm run cli          # interactive menu:
                     #   1 register · 2 recertify · 3 prove fair pricing
                     #   4 ship · 5 deliver · 6 withdraw
                     #   7 read claims · 8 balance · 9 exit
npm run test         # offline unit tests (vitest)
npm run test:e2e     # on-chain smoke check against the deployed contract
npm run register-demo # seeds the ledger with demo products at each lifecycle stage
npm run frontend:dev # public claims dashboard (http://localhost:5173)
```

The CLI walks through all six circuits, each of which produces a real
zero-knowledge proof on the devnet:

1. **registerProduct** — publish claims + batch metadata for a new product at
   stage MANUFACTURED (compliance score 80/100 before pricing is proven).
2. **recertifyProduct** — re-prove the same claims on a fresh supplier list,
   enforce the certificate-expiry policy, bump `auditCount`.
3. **proveFairPricing** — prove every supplier is paid ≥ the public floor;
   the score climbs to 100/100.
4. **shipProduct** — move MANUFACTURED → IN_TRANSIT; requires a fresh proof
   that every supplier is still certified/ethical and every route compliant.
5. **deliverProduct** — move IN_TRANSIT → DELIVERED; proves the delivered
   quantity never exceeds the committed batch and every route + price floor
   still holds.
6. **withdrawClaim** — remove a claim; ownership proven from the secret key
   without ever revealing it.

Answer any sourcing question with `n` and the proof fails — claims cannot be
faked.

## Frontend

`npm run frontend:dev` runs a read-only dashboard that decodes the contract's
public state straight from the indexer and renders the certification ledger —
the exact view a third-party auditor would have. For each product it shows the
lifecycle timeline (MANUFACTURED → IN_TRANSIT → DELIVERED), batch/quantity, the
compliance score and the proven claims, plus aggregate stats across the whole
ledger. Supplier records never touch the browser.

```bash
cd frontend
cp .env.example .env.local   # optionally point at preview/preprod + address
npm run dev
```

## Networks

| Flag | Network | Notes |
| --- | --- | --- |
| `undeployed` (default) | local devnet (`docker compose up -d`) | genesis-funded, zero config |
| `--network preview` | Midnight preview network | fund via the Nethermind faucet |
| `--network preprod` | Midnight preprod network | fund via the Nethermind faucet |

```bash
npm run setup -- --network preview   # deploy to preview
npm run network                      # show/set active network
```

The proof server always runs locally via Docker; the public networks are only
used for the node/indexer/faucet.

> **Runtime note:** `package.json` pins `@midnight-ntwrk/onchain-runtime-v3` to
> `3.0.0` (via `overrides`) and the install is deduped to a single physical
> copy. Midnight.js 4.1.x and compact-runtime must share one WASM runtime
> instance, otherwise contract calls fail with `expected instance of StateValue`.
> If you reinstall and hit that error, run `npm dedupe`.

## Project structure

- `contracts/supply-chain.compact` — the Compact contract (privacy logic).
- `frontend/` — Vite + React dashboard of the public claims.
- `tests/` — offline unit tests (network config, supplier witnesses, key
  derivation, contract assembly).

## License

MIT
