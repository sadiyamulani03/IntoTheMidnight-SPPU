/**
 * useMidnight — DApp Connector wallet integration (CAIP-372).
 *
 * The Midnight **wallet browser extension** injects a connector under
 * `window.midnight.<id>`. Two generations of the DApp-connector API exist and
 * we support BOTH:
 *
 *   - v1 (CAIP-372, what 1AM/Lace inject today): the entry exposes
 *     `connect(networkId)`, `name`, `icon`, `apiVersion`, `rdns`.
 *   - legacy (older `react-wallet-connector`): the entry exposes
 *     `wallet.connect()`.
 *
 * Crucially we never hardcode a wallet name / id: we enumerate
 * `Object.values(window.midnight)`, match a connectable entry, and poll until
 * the extension injects it (extensions load asynchronously, AFTER
 * DOMContentLoaded — a naive boot-time check always reports "not found").
 *
 * Only public wallet concerns are read here (the unshielded address and network
 * id). PRIVACY CONTRACT: supplier witness inputs never enter this hook.
 */
import { useCallback, useState } from 'react';
import { getConfig, networkLabel, type NetworkId } from '../lib/networks';

/** v1 / CAIP-372 connector entry (as injected by 1AM, etc.). */
export interface DAppConnectorV1 {
  rdns?: string;
  name?: string;
  icon?: string;
  /** e.g. "4.0.1"; used for feature detection, not gating. */
  apiVersion?: string;
  connect?: (networkId?: string) => Promise<MidnightConnectorWallet>;
}

/** Legacy entry shape (older `react-wallet-connector`). */
export interface DAppConnectorLegacy {
  isEnabled?: boolean;
  wallet?: {
    connect?: () => Promise<MidnightConnectorWallet>;
  };
}

export type DAppConnectorEntry = DAppConnectorV1 & DAppConnectorLegacy;

/**
 * Do the busy-work of discovering a connectable wallet entry. Accepts both the
 * v1 `connect(networkId)` entry and the legacy `wallet.connect()` entry.
 */
function findConnector(
  midnight: Record<string, DAppConnectorEntry>,
): { app: DAppConnectorEntry; kind: 'v1' | 'legacy' } | undefined {
  const apps = Object.values(midnight);
  // v1 first (the shape 1AM injects today), then legacy.
  const v1 = apps.find((e) => typeof e?.connect === 'function');
  if (v1) return { app: v1, kind: 'v1' };
  const legacy = apps.find((e) => typeof e?.wallet?.connect === 'function');
  if (legacy) return { app: legacy, kind: 'legacy' };
  return undefined;
}

/**
 * The connector wallet returned by `wallet.connect()`. Method access is made
 * optional so the hook type-checks against the broad DApp-connector ecosystem
 * and degrades gracefully when a variant omits a method.
 */
export interface MidnightConnectorWallet {
  getUnshieldedAddress?: () => Promise<string>;
  /** Some wallet variants already expose the current network id. */
  getNetworkId?: () => Promise<string>;
  /** DApp-connector adapter exposing the proving/balancing provider set. */
  getMidnightProviders?: () => Promise<unknown>;
  dispose?: () => void | Promise<void>;
}

export type WalletConnectStateIds =
  | 'idle'
  | 'installed'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface WalletConnectState {
  status: WalletConnectStateIds;
  /** Error / notice text, safe to render (no private data). */
  message?: string;
}

interface MidnightWindow {
  midnight?: Record<string, DAppConnectorEntry>;
}

const POLL_INTERVAL_MS = 300;
const POLL_TIMEOUT_MS = 6000;

export interface UseMidnightReturn {
  state: WalletConnectState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Public (unshielded) address of the connected user, if any. */
  address?: string;
  /** Configured network badge string, e.g. "Preview". */
  networkLabel: string;
  network: NetworkId;
  /** The connected connector wallet (for prove & submit), if any. */
  connector?: MidnightConnectorWallet;
}

export function useMidnight(): UseMidnightReturn {
  const [state, setState] = useState<WalletConnectState>({ status: 'idle' });
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [wallet, setWallet] = useState<MidnightConnectorWallet | undefined>(undefined);

  const { network } = getConfig();

  const connect = useCallback(async () => {
    const win = window as unknown as MidnightWindow;

    // Extensions inject ASYNCHRONOUSLY, after DOMContentLoaded. Poll briefly so
    // the commonly-raced "boot-time check finds nothing" failure never happens.
    const startedAt = Date.now();
    let found: { app: DAppConnectorEntry; kind: 'v1' | 'legacy' } | undefined;
    while (!found) {
      const m = win.midnight;
      if (m && typeof m === 'object') found = findConnector(m);
      if (found) break;
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) break;
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    if (!found) {
      setState({ status: 'error', message: 'Midnight wallet not detected. Install the Midnight Wallet (e.g. 1AM) — or if installed, reload the page and grant "Midnight" access.' });
      return;
    }

    setState({ status: 'connecting' });
    try {
      let connected: MidnightConnectorWallet | undefined;
      if (found.kind === 'v1') {
        // v1 / CAIP-372: pass the target network id and await authorization.
        connected = await found.app.connect?.(network);
      } else {
        connected = (await found.app.wallet?.connect?.()) as MidnightConnectorWallet | undefined;
      }

      if (!connected) {
        setState({ status: 'error', message: 'The wallet did not return a session. Your wallet may need to be unlocked — open it and retry.' });
        return;
      }

      // Network validation: where the wallet reports its network id, confirm it
      // matches the configured VITE_NETWORK so a mismatch can never be masked.
      if (typeof connected.getNetworkId === 'function') {
        const wid = (await connected.getNetworkId()).toLowerCase();
        if (wid !== network && `${network}-network` !== wid && `unshielded-${network}` !== wid) {
          await connected.dispose?.();
          setState({
            status: 'error',
            message: `Wallet is on ${wid}, but the app expects ${network}. Switch networks in the wallet or set VITE_NETWORK.`,
          });
          return;
        }
      }

      let addr: string | undefined;
      if (typeof connected.getUnshieldedAddress === 'function') {
        const raw = await connected.getUnshieldedAddress();
        addr = typeof raw === 'string' ? raw : raw != null ? String(raw) : undefined;
        setAddress(addr);
      } else {
        setAddress(undefined);
      }

      setWallet(connected);
      setState({ status: 'connected', message: addr });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [network]);

  const disconnect = useCallback(async () => {
    await wallet?.dispose?.();
    setWallet(undefined);
    setAddress(undefined);
    setState({ status: 'disconnected' });
  }, [wallet]);

  return {
    state,
    connect,
    disconnect,
    address,
    connector: wallet,
    networkLabel: networkLabel(network),
    network,
  };
}