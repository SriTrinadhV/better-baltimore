import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Vite's esbuild pre-bundling repackages maplibre-gl's internal worker
    // entry in a way that Firefox serves/loads with an empty MIME type,
    // which Firefox refuses to run as a module worker ("blocked because of
    // a disallowed MIME type") — the map's WebGL context then gets
    // abandoned with no worker pool. Excluding it from pre-bundling makes
    // Vite serve the real files from node_modules with correct types.
    exclude: ['maplibre-gl'],
  },
  build: {
    rollupOptions: {
      output: {
        // src/components/CityMap.tsx imports maplibre-gl's worker file (and
        // its shared-code sibling) via `?url` to work around MapLibre's own
        // broken import.meta.url-relative worker autodetection under
        // bundling. `?url` copies those two files byte-for-byte rather than
        // processing them, so the worker's own unmodified
        // `import ... from "./maplibre-gl-shared.mjs"` only resolves if both
        // land in the same output directory under those exact (unhashed)
        // names — Vite's default per-asset content hash would break that.
        assetFileNames: (asset) => {
          if (asset.names?.some((n) => n === 'maplibre-gl-worker.mjs' || n === 'maplibre-gl-shared.mjs')) {
            return 'assets/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
