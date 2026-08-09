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
  // GitHub Pages hosts project sites under /<repo>/; override via VITE_BASE
  // (default '/' for local dev / Vercel).
  base: process.env.VITE_BASE ?? '/',
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
    // compact-runtime is served as source (its WASM/ESM needs raw handling);
    // object-inspect is a CJS (module.exports) dep it default-imports, so it
    // must be pre-bundled or Vite never synthesises a `default` export.
    exclude: ['@midnight-ntwrk/compact-runtime'],
    include: ['object-inspect'],
  },
});
