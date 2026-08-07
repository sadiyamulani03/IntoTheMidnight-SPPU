/**
 * prove.ts — publish a Zero-Knowledge claim through the Midnight DApp Connector.
 *
 * This is the REAL adapter used by the "prove & publish" UI. It follows the
 * DApp-connector / react-wallet-connector flow: a connected Midnight wallet
 * hands back its providers (proving, balancing, submitting) and we use them
 * with `findDeployedContract` to prove and submit a circuit call for the
 * supply-chain contract.
 *
 * PRIVACY CONTRACT:
 *   • The `suppliers` witness is built fresh in the caller (lib/witness.ts),
 *     passed in here, used for the proof, and dropped. It is never returned,
 *     logged, rendered or persisted.
 *   • Only the PUBLIC transaction id / block is returned to the UI.
 */

export interface ProveResult {
  circuit: string;
  /** Public on-chain transaction id (safe to display). */
  txId: string;
  blockHeight: bigint;
  /** Human message — safe to show (contains no private data). */
  ok: true;
}

export interface ProveFailure {
  ok: false;
  message: string;
}

export type ProveOutcome = ProveResult | ProveFailure;

export interface ProvingProviders {
  // The wallet connector fills these in. We keep them minimal and let the
  // runtime adapter supply the exact objects `findDeployedContract` expects.
  [key: string]: unknown;
}

export interface MidnightProveWallet {
  getMidnightProviders?: () => Promise<unknown>;
}

export type CircuitKind = 'registerProduct' | 'recertifyProduct' | 'proveFairPricing'
  | 'shipProduct' | 'deliverProduct' | 'withdrawClaim';

/**
 * Prove and submit a circuit call. `publicArgs` are the disclosed arguments,
 * `suppliers` is the PRIVATE witness vector. Returns only public tx metadata.
 */
export async function submitCircuit(
  wallet: MidnightProveWallet,
  contractAddress: string,
  privateStateId: string,
  circuit: CircuitKind,
  publicArgs: unknown[],
  suppliers: unknown[],
): Promise<ProveOutcome> {
  const providers = await wallet.getMidnightProviders?.();
  if (!providers) {
    return {
      ok: false,
      message:
        'The connected wallet did not return a providers adapter. Enable "proving" support in the wallet, or confirm the connector method (see README "Wallet integration").',
    };
  }

  try {
    const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
    const compiled = await buildBrowserContract();

    const deployed: any = await findDeployedContract(providers as any, {
      compiledContract: compiled as any,
      contractAddress,
      privateStateId,
      initialPrivateState: {},
    });

    // The witness vector is consumed here for the zero-knowledge proof and then
    // goes out of scope. Nothing that identifies a supplier is returned.
    const tx = await deployed.callTx[circuit](...publicArgs, suppliers);

    return {
      ok: true,
      txId: tx.public.txId,
      blockHeight: tx.public.blockHeight,
      circuit,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Build the compiled supply-chain contract for the browser. The `companySecretKey`
 * witness is bound to a throwaway derivation; only `withdrawClaim` invokes it and
 * that action requires owning the company key anyway. All other circuits never run
 * it, so no secret is materialised for register/deliver.
 */
async function buildBrowserContract() {
  const compiled = await import(
    /* @vite-ignore */ '../../../contracts/managed/supply-chain/contract/index.js'
  );
  const { CompiledContract } = await import('@midnight-ntwrk/midnight-js-protocol/compact-js');

  // 32 bytes, deterministic, NEVER the real company key (see comment above).
  const dummyOwnerKey = new Uint8Array(32).fill(0x7f);

  const witnesses = {
    companySecretKey: () => [null, dummyOwnerKey],
  };

  // In the browser the compiled ZK assets (.wasm/"cirrus") are served from the
  // public dir; point at their base URL. Relative "managed/..." keeps local dev
  // working; env override fixes host. The wallet connector reloads these.
  const assetsUrl: string = import.meta.env.VITE_ZK_ASSETS_URL ?? 'managed/supply-chain';

  return CompiledContract.make('supply-chain', compiled.Contract).pipe(
    CompiledContract.withWitnesses(witnesses as never),
    CompiledContract.withCompiledFileAssets(assetsUrl as never),
  );
}