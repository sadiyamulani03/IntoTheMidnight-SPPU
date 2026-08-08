import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

// Surface async errors (the ones a render boundary can't catch) as a visible
// toast so a crash on wallet-connect never becomes an unexplained blank page.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason);
  const err = event.reason instanceof Error ? event.reason.message : String(event.reason);
  showErrorToast(`Unhandled error: ${err}`);
});
window.addEventListener('error', (event) => {
  console.error('[window error]', event.error);
  showErrorToast(`Unhandled error: ${event.error instanceof Error ? event.error.message : String(event.error ?? event.message)}`);
});

function showErrorToast(message: string) {
  let el = document.getElementById('err-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'err-toast';
    el.setAttribute(
      'style',
      'position:fixed;left:16px;bottom:16px;z-index:9999;max-width:520px;' +
        'background:#2a0d16;border:1px solid rgba(255,92,135,.4);color:#ffb3c4;' +
        'padding:12px 16px;border-radius:12px;font:13px/1.5 ui-monospace,monospace;' +
        'box-shadow:0 12px 40px rgba(0,0,0,.6);word-break:break-word;',
    );
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.display = 'block';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);