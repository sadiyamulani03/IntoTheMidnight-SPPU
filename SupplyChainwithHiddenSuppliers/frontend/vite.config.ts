import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { resolve } from 'node:path';

// The dashboard decodes on-chain state with the compiled contract module,
// which lives outside the frontend/ root. Allow Vite to serve those files.
const workspaceRoot = resolve(__dirname, '..');

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
  resolve: {
    alias: {
      '@contracts': resolve(workspaceRoot, 'contracts'),
    },
  },
  // The compact runtime's WASM is loaded directly (ESM wasm import), which
  // needs special handling in Rollup-based bundlers.
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/compact-runtime'],
  },
});
