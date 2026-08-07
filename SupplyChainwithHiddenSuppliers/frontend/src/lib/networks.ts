/**
 * Network helpers for the ChainShield dashboard.
 *
 * The dashboard is built for the Midnight **Preview** network by default. In a
 * local-development context it can instead be pointed at the local devnet that
 * `docker compose up` starts (the "undeployed" preset) — the README explains
 * both modes.
 */

export type NetworkId = 'preview' | 'preprod' | 'undeployed';

export interface ChainShieldEnv {
  network: NetworkId;
  /** Indexer GraphQL endpoint used to read PUBLIC contract state. */
  indexerUrl: string;
  /** Deployed contract address (read from VITE_CONTRACT_ADDRESS). */
  contractAddress: string;
  /**
   * When `true`, the "prove & publish" panel is wired to a real DApp Connector
   * wallet over HTTPS. Set it only once you have a funded Midnight Wallet
   * browser extension on the configured network. See the README.
   */
  enableProve: boolean;
}

/** Read the dashboard configuration from Vite env vars with safe defaults. */
export function getConfig(): ChainShieldEnv {
  const network = (import.meta.env.VITE_NETWORK as NetworkId) || 'preview';
  return {
    network,
    indexerUrl:
      import.meta.env.VITE_INDEXER_URL ??
      import.meta.env.VITE_MIDNIGHT_INDEXER_URL ??
      'https://indexer.preview.midnight.network',
    contractAddress:
      import.meta.env.VITE_CONTRACT_ADDRESS ??
      import.meta.env.VITE_MIDNIGHT_CONTRACT_ADDRESS ??
      '',
    enableProve: toBoolean(import.meta.env.VITE_ENABLE_PROVE),
  };
}

function toBoolean(raw: string | undefined): boolean {
  return raw === 'true' || raw === '1';
}

/** Human-friendly label for the connected network shown in the header badge. */
export function networkLabel(network: NetworkId): string {
  switch (network) {
    case 'preview':
      return 'Preview';
    case 'preprod':
      return 'Preprod';
    default:
      return 'Devnet';
  }
}