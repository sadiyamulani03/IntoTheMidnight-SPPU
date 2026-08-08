# Demo video — storyboard (target ≈ 4:30)

Style: screen capture + light B-roll, calm explainer voice, no music. Every
"we proved this" beats a line from the test suite so claims are checkable.

---

## 00:00–00:25 · Hook

- **Shot:** Dashboard, `demo` mode, scrolled past the hero to the three coffee
  products.
- **VO:** "Every one of these products claims every supplier is certified and
  fairly paid. The twist: the proof doesn't reveal a single supplier."
- **On screen:** the four claim badges, then the per-product **proof history**.

## 00:25–01:10 · The problem

- **Shot:** zoom into `contracts/supply-chain.compact`, comment block
  "PUBLIC ledger state" vs "PRIVATE witness data".
- **VO:** "A supply chain is a pile of secrets — who you buy from, what you pay
  them, which routes you ship on. Publishing them is commercial suicide.
  Hiding them means nobody can verify a thing."
- **On screen:** highlight `Supplier` struct fields (`identityHash`, `pricePaid`,
  `routeCompliant`).

## 01:10–02:10 · The mechanism (selective disclosure)

- **Shot:** run `registerProduct` in the *Prove & publish* panel (demo).
- **VO:** "When we prove, a circuit folds over eight private suppliers. Only the
  claim booleans, the certified count and the fair-trade floor are disclosed."
- **On screen:** highlight every `disclose(...)` in circuit 1, then show a
  product card flipping open — **no identities, no prices, no routes**.
- **Cut to code:** `tests/privacy.test.ts` passing — "the public Ledger type
  cannot carry a private supplier field."
- **VO:** "This isn't a promise — it's a type error if we slip."

## 02:10–02:55 · What can't you fake? (fail-closed)

- **Shot:** terminal, `npm run test` scrolling; freeze on `adversarial.test.ts`.
- **VO:** "Flip a claim to 'no' and the proof fails. A lapsed certificate
  cannot ship. Deliver before it was shipped — rejected. These are assertions
  in the circuit, not UI rules."
- **On screen:** highlight `assert(certified, "…")` lines and the test names
  (stale cert, out-of-range price, skipped stage, forge attempt).

## 02:55–03:35 · The ledger everyone can read

- **Shot:** scroll the public dashboard (KPI row, product cards, ConsumerVerify).
- **VO:** "What lands on chain is a regulator's dream: lifecycle stage, audit
  count, an auditable compliance score — recomputable from four public
  booleans by anyone, no trust needed."
- **On screen:** `scoreOf` formula — 30/30/20/20 — overlaid on a product's score.

## 03:35–04:10 · Real chain, not a mock

- **Shot (if clip available):** `npm run setup` deploying; else terminal output.
- **VO:** "The demo mode you just saw is one flag; the same contract compiles
  and deploys to the Midnight devnet or public Preview. The relay builds the
  witness server-side and zeroes the buffers the moment a proof is done."
- **On screen:** `wipeSuppliers` in `api-server.ts` + its test.

## 04:10–04:30 · Close / future

- **Shot:** dashboard hero.
- **VO:** "Next: certification agencies sign claims directly, and a QR at point
  of sale resolves the proof. The route from 'trust me' to 'prove it' is
  already here — it just needs no wallet."
- **On screen:** `docs/tier2-contract-draft.md` headline.

---

**Recording checklist:** use the demo mode (`VITE_DEMO_MODE=true`), 1440p, keep
devtools closed, pre-warm `npm run test` output so it's fast on camera, and
caption all code because judges read faster than the VO.
