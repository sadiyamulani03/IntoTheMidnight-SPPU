/**
 * WalletConnect — connect / disconnect the Midnight DApp Connector wallet.
 *
 * Renders:
 *  - a network badge (e.g. "Devnet") and the connected public address,
 *  - a Connect / Disconnect button,
 *  - the relevant error states: wallet not installed, connect rejected, and
 *    network mismatch (surfaced from the hook, never fabricating data).
 *
 * PRIVACY CONTRACT: this component only renders the user's *unshielded* public
 * address and wallet error text. No supplier privacy input is ever passed in,
 * rendered, logged or stored here.
 */
import type { UseMidnightReturn } from '../hooks/useMidnight';

export function NetworkBadge({ label }: { label: string }) {
  return (
    <span className="badge badge-net">
      <span className="net-dot" />
      {label}
    </span>
  );
}

export function WalletConnect({ wallet }: { wallet: UseMidnightReturn }) {
  const { state, networkLabel } = wallet;
  const connecting = state.status === 'connecting';
  const connected = state.status === 'connected';

  return (
    <div className="wallet-panel">
      <div className="wallet-row">
        <NetworkBadge label={networkLabel} />
        {connected && wallet.address ? (
          <span className="wallet-addr" title="Unshielded (public) address">
            {shortAddress(wallet.address)}
          </span>
        ) : (
          <span className="muted">Not connected</span>
        )}
        {connected ? (
          <button className="btn-base btn-ghost" onClick={() => void wallet.disconnect()}>
            Disconnect
          </button>
        ) : (
          <button className="btn-base btn-primary" disabled={connecting} onClick={() => void wallet.connect()}>
            {connecting ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>

      {state.status === 'error' && state.message && <p className="error">{state.message}</p>}
      {state.status === 'disconnected' && (
        <p className="wallet-status-text">Wallet disconnected. Reconnect to publish Zero-Knowledge claims.</p>
      )}
    </div>
  );
}

export function shortAddress(addr: string): string {
  if (typeof addr !== 'string' || addr.length === 0) return 'connected';
  return addr.length > 18 ? `${addr.slice(0, 10)}…${addr.slice(-6)}` : addr;
}