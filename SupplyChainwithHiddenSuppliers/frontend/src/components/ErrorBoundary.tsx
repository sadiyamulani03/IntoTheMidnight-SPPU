/**
 * ErrorBoundary — catches any runtime render error so the dashboard never goes
 * blank. Shows the message + a reload button instead of a white screen.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="error" style={{ margin: 24, padding: 18 }}>
          <h3 style={{ margin: '0 0 8px' }}>Something went wrong rendering the dashboard.</h3>
          <p style={{ fontSize: 13, wordBreak: 'break-word' }}>{this.state.error.message}</p>
          <button className="btn-base" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}