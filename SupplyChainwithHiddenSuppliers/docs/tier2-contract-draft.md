# Tier 2 — Independent Certification Draft (no redeploy)

**Status:** design draft · **Not compiled, not deployed.** This document is a
specification for the next contract iteration. It does not change the current
`supply-chain.compact`.

## Problem

Today the company certifies its own suppliers (`Supplier.isCertified` is a
private witness field the company asserts itself). The claims are honest
fail-closed (you cannot fake a "certified" answer to the UI), but the *source
of truth* for "is this supplier certified" is the company's own word. A
regulator asking "who said so?" gets: the company.

## Goal

Move certification authority to **independent agencies** that cryptographically
sign `certificateIssued` claims. The company's circuit then proves *"every one
of my suppliers holds a certificate signed by an accredited agency, none
expired"* — **without revealing which suppliers, which agency(s), or which
certificates** it holds.

## Design

Three roles:

| Role     | Holds                                   | Publishes                                  |
| -------- | --------------------------------------- | ------------------------------------------ |
| Agency   | private signing key                     | accredited public keys (registry contract) |
| Company  | supplier list + signed certs (private)  | ZK claims + aggregate count (ledger)       |
| Verifier | nothing                                 | verifies claims + ZK proofs                |

### Public registry (agency-controlled)

A small new contract `cert-registry.compact`, deployable by each accredited
agency:

```compact
// DRAFT — not compiled.
export sealed ledger agencyKey: Bytes<32>;          // this agency's Ed25519 pk
export ledger accredited: Map<Bytes<32>, Boolean>;  // agencies accredited by DA

export circuit accreditAgency(pk: Bytes<32>): [] { ... }   // governance only
export circuit issueCertificate(                           // agency authorizes
    supplierId: Bytes<32>,   // hash of real-world supplier identity
    certId: Bytes<32>,
    expiry: Uint<64>,
    signature: Bytes<64>,
): [] { /* registry entry, public */ }
```

The *registry* itself is public — a Merkle/append-only log of issued
certificates and their revocation status. What stays private is **which entries
a company's proof actually consumes**.

### Company circuit: membership with a hidden leaf

Two candidate mechanisms; both keep the supplier/certificate private. Compact
support for the signature primitive should be confirmed before implementation.

**Option A — on-circuit signature verification (preferred, if `verifyEd25519`
is available in Compact):**

```compact
// DRAFT — not compiled. sketch only.
witness agencyKeys(): Vector<4, Bytes<32>>;          // accredited agencies
witness certs(): Vector<8, Certificate>;             // per supplier: {certId, expiry, sig}

// inside recertifyProduct / shipProduct / deliverProduct:
const everySupplierCertified =
  fold((acc, i) =>
    acc &&
      fold((ok, a) =>
        ok || verifyEd25519(certs[i].sig, a, certMsg(certs[i], suppliers[i].identityHash)),
        false, agencyKeys),
    true, indices);
assert(everySupplierCertified, "A supplier lacks an agency-signed certificate");
```

- The company proves a signature from *some* accredited agency without saying
  which: it folds `∨` over `agencyKeys`, so the verifier only learns "accredited".
- `certMsg` binds the certificate to the supplier identity so certificates
  cannot be replayed across suppliers.

**Option B — Merkle membership against the registry root (works with only
`persistentHash`):**

```compact
// DRAFT — not compiled. sketch only.
// Agency commits the set of active certs as a Merkle root on the registry.
ledger certRoot: Bytes<32>;

witness certProofs(): Vector<8, Vector<6, Bytes<32>>>;   // merkle paths
witness certLeaves(): Vector<8, Bytes<32>>;              // hash(certId | expiry | supplierId)

const allPresent =
  fold((acc, i) => acc && verifyMerklePath(certRoot, certLeaves[i], certProofs[i]),
       true, indices);
```

- Only the root is on-chain; the path position is private, so the company never
  reveals *which* certificates it holds.
- Simple to build from today's `persistentHash`; no new cryptographic primitive.

Both options plug into the **existing** circuits' `assert(certified, …)` slot:
`isCertified` per supplier is replaced by "signature/Merkle verified". The
`certifiedCount` aggregate, `scoreOf`, lifecycle state machine, and `disclose()`
policy are unchanged — so **the public `ProductRecord` shape and the dashboard
stay compatible**.

### QR consumer verification

Tie-in so the story has an endpoint:

- QR encodes `productId` (+ optionally the block the claims were proven in).
- A public `verify` endpoint resolves the QR against the indexer, recomputes
  `scoreOf` from the four public booleans (the auditable formula), and returns
  the claims + proof validity.
- Optional on-chain binding: a tiny `proveProductClaims(productId, claims)` circuit
  that discloses only the claim booleans for that product, letting a consumer
  verify a *fresh* zero-knowledge proof from the QR without a wallet.
- The dashboard's existing `ConsumerVerify` panel already implements the
  resolve-and-render half — the QR path reuses it.

## Migration plan (when we do it — not now)

1. **Deploy `cert-registry.compact`** once (agency-owned). Registry address is
   public and versioned.
2. **Ship `supply-chain-v2.compact` as a separate contract.** It reuses the v1
   `ProductRecord`/`scoreOf` shapes so the dashboard can read both with one
   code path.
3. **Company side:** the private sourcing system adds `(certId, expiry, sig)` per
   supplier to the witness builder (`lib/witness.ts`); the relay builds the new
   proof types server-side and still wipes buffers after proving.
4. **Point the deployment:** update `VITE_CONTRACT_ADDRESS` /
   `.midnight-state.json` to the v2 address. Old products are readable via the
   v1 contract until the migration window closes.
5. **Testing:** mirror `tests/adversarial.test.ts` — new adversarial cases:
   forged signature, cert bound to the wrong supplier, revoked cert, expired
   cert, proof over a non-accredited agency.

## Explicitly out of scope for Tier 2

- On-chain supply data (plaintext) — the point is keeping it off-chain.
- Full KYC — agencies remain the identity anchors; the chain proves the *claim*.
- Cross-contract calls in Compact (unsupported today) — hence the separate
  registry contract + witness-based membership instead of a contract call.
