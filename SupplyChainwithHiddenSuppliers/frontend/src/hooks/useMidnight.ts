/**
 * useMidnight — DApp Connector wallet integration.
 *
 * The Midnight **wallet browser extension** injects a connector API at
 * `window.midnight`. Crucially, we never hardcode a wallet name / id: we
 * enumerate `Object.values(window.midnight)` and use the first *enabled*
 * entry. A wallet on the **Preview** network exposes an unshielded address and
 * the ability to prove + submit Midnight circuit calls.
 *
 * The connector subset typed here follows the Midnight reference connector
 * (`react-wallet-connector` docs + the `1am-wallet` browser demo). It is used
 * for B1: discovering the wallet, connecting, reading the unshielded address,
 * validating the network, and disconnecting — with clear error states for
 * "not installed", "rejected", and "network mismatch".
 *
 * PRIVACY CONTRACT: this hook only ever touches public wallet concerns (the
 * unshielded address and network id). Supplier witness inputs NEVER enter this
 * hook, React state, or any persisted store.
 */
import { useCallback, useState } from 'react';
import { getConfig, networkLabel, type NetworkId } from '../lib/networks';

/** A wallet app entry injected by an enabling wallet under `window.midnight`. */
export interface DAppConnectorEntry {
  apiVersion?: string;
  isEnabled?: boolean;
  wallet?: {
    connect?: () => Promise<MidnightConnectorWallet>;
  };
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
    if (!win.midnight) {
      setState({ status: 'error', message: 'Midnight wallet extension not installed. Install the Midnight Wallet and refresh the page.' });
      return;
    }
    const apps = Object.values(win.midnight);
    const app = apps.find((entry) => entry?.isEnabled && typeof entry?.wallet?.connect === 'function');
    if (!app) {
      setState({ status: 'error', message: 'No enabled Midnight wallet found on this page. Unlock / enable it and retry.' });
      return;
    }

    setState({ status: 'connecting' });
    try {
      const connected = await app.wallet!.connect!();

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
        addr = await connected.getUnshieldedAddress();
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