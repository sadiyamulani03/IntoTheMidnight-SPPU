# ChainShield — 60-second evaluation

**What it is:** a zero-knowledge supply-chain dApp on Midnight. Companies prove
*ethical sourcing, every supplier certified, fair-trade pricing, compliant
routes, and a MANUFACTURED → IN_TRANSIT → DELIVERED lifecycle* — while supplier
identities, certificate numbers, prices and routes **never leave the wallet**.

## Try it in 60 seconds (no wallet needed)

```bash
cd frontend
cp .env.example .env.local    # VITE_DEMO_MODE=true, empty contract address
npm install && npm run dev    # → http://localhost:5173
```

1. **Ledger** — three single-origin-coffee products, each with claims, a
   compliance score (0–100), and a per-product **proof-history timeline**.
2. **Prove & publish** — every action is labelled *"Proved without revealing
   your input"*. Run `registerProduct → ship → deliver` on a product and watch
   the stage bar move — the publish is simulated, so it needs no tNIGHT.
3. **Find the seam** — the whole point: click any product; you never see an
   identity, a price or a route, only claims. That's ZK.

## The one-slide story

| Question                | Answer                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| What does it do?        | Publishes only *proofs of* ethical/certified/fair-priced products.     |
| Why privacy?            | Identities, prices, routes and cert numbers are commercially sensitive.|
| Why ZK and not "just encrypt"? | Anyone can verify the claim without an intermediary — enforced by the chain, not by trust. |
| What's the ledger?      | Booleans, an aggregate certified `count`, a committed fair-trade floor. |
| What can't you fake?    | A proof asserting `certified=n`, an expired cert, a skipped stage, or an unregistered product simply **fails** (`assert`). |
| Where's the hard part you solved? | Fail-closed circuits + a relay that builds the witness server-side and **zeroes the buffers** after proving. |

## Reference material

- **Contract:** `contracts/supply-chain.compact` — 6 circuits, all discloses
  annotated.
- **Privacy proof (it's a test):** `tests/privacy.test.ts` (the compiled public
  `Ledger` type *cannot* carry a private supplier field), and
  `tests/adversarial.test.ts` (fail-closed + relay ephemerality).
- **Auditable score (`scoreOf`):** 30/30 certified+ethical, 20/20 routes+fair —
  recomputable from the four public booleans by anyone.
- **Future (Tier 2 draft):** accredited certification agencies sign
  `certificateIssued` claims — see `docs/tier2-contract-draft.md`.
- **Architecture:** `docs/architecture.md`.

## Common questions

- **Is this a blockchain demo or a UI demo?** Both. `npm run setup` deploys the
  compiled contract to the Midnight devnet; `frontend/:dev` shows the exact
  indexer view. `--network preview` deploys to public Preview.
- **Where does the data "go"?** Only the disclosed fields are stored on-chain.
  The supplier witness is generated at proof time and destroyed.
- **Who is the attacker?** See the threat-model table in the README — a
  compromised relay can attest lies (it's the company's own relay) but cannot
  *exfiltrate* data it never holds; a hostile indexer sees only public claims.
- **Does the demo mode lie?** The claims/drop format, circuit set and score
  formula are the same code path (`lib/witness.ts`, `scoreOf`); demo only
  swaps the network call for a seeded in-browser ledger.