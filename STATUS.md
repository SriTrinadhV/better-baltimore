# Better Baltimore — Status

## Current phase
All 9 execution-plan phases built. A real map-rendering bug was found and fixed post-Phase-9 (see below) — that's the one item still needing your visual confirmation before this is submission-ready.

## Map rendering bug: found and fixed (real bug, not a sandbox artifact)
Earlier notes in this file guessed the map's "stuck loading" behavior was a limitation of this session's sandboxed test browser. That was wrong — you confirmed it failed identically in your real Firefox 128 and Chromium on this Jetson (WebGL itself was confirmed fully hardware-accelerated via `about:support`, ruling out a GPU/driver problem). Root-caused via direct console/network/event inspection to **three stacked bugs**, all now fixed in `vite.config.ts` and `src/components/CityMap.tsx`:

1. **Dev server**: Vite's esbuild dependency pre-bundling repackaged maplibre-gl's internal worker script in a way that got served with an empty/missing `Content-Type`, which Firefox correctly refuses to run as a module worker ("blocked because of a disallowed MIME type"). Fixed with `optimizeDeps.exclude: ['maplibre-gl']`.
2. **A `manualChunks` bundle-splitting change from Phase 7** (added purely to shrink bundle size) broke Rollup's normal handling of MapLibre's separately-emitted worker asset. Removed.
3. **The real underlying issue, present since Phase 0, in both dev and production**: MapLibre GL JS v6 locates its own worker script via a URL built from `import.meta.url` relative to wherever its own module code executes. Once any bundler inlines that code into a different chunk (Vite's default behavior), the constructed URL points at a file that doesn't exist. Confirmed by directly instrumenting a raw MapLibre instance (`load`/`idle` never fired, but `styledata`/`sourcedata` did — the pipeline was stalling partway) and finally by finding "Failed to load module script: ... MIME type of text/html" for `/assets/maplibre-gl-worker.mjs` in a production build, where that exact file didn't exist in `dist/assets/` at all. Fixed by explicitly importing the real worker file (and its own internal `./maplibre-gl-shared.mjs` sibling import) via Vite's `?url` suffix and calling MapLibre's own `setWorkerUrl()` API, with `vite.config.ts`'s `assetFileNames` pinning both to their original unhashed names so the worker's unmodified relative import still resolves correctly on disk.

Verified in both `npm run dev` and a full `npm run build` + `vite preview`: no MIME errors anywhere, and MapLibre's `load` and `idle` events both fire cleanly end to end. The one thing this session could not directly confirm is pixels actually painting on screen — the sandboxed browser tool used for automated verification here has its own separate limitation showing WebGL canvas content in screenshots, unrelated to the app itself (every other check — console, network, event lifecycle — came back clean). **Action item: hard-refresh and confirm the map visually renders.** The specific bugs that were definitely breaking it are fixed; if it's still not painting after that, the next thing to check would be whether canvas content is being composited at the OS/window level on this Jetson, which would be a new and different question from the one just solved.

## Completed functionality
- Vite + React + TypeScript app shell, MapLibre + OpenFreeMap 3D Baltimore map, REALITY/DATA/BETTER modes, six mission markers, full mission flow, deterministic simulation engine (unit tested).
- SpacetimeDB is the authoritative backend (local, ARM64-native, verified multi-client sync).
- **Real Baltimore City open data** backs all three deep missions:
  - `scripts/lib.py` + `scripts/derive_hotspots.py`: scans a 6x6 grid over Baltimore, querying the three verified live ArcGIS layers (Tree Canopy, Vacant Building Notices, Floodplain) per cell with an intersecting-envelope spatial filter (not a full citywide dump), and picks the top-scoring cell per mission.
  - Fixed two real data-integrity bugs caught during derivation: (1) vacant-building counts were silently capped at ArcGIS's 1000-record page size — now uses a `returnCountOnly` query for the true count; (2) polygon overlay files (floodplain especially) shipped each intersecting feature's *entire* unclipped geometry, producing a 14MB file — now clipped to the query cell and simplified before writing.
  - Real derived results: Cool the Block → 0.2% canopy coverage cell; Reclaim the Lot → 3,197 vacant building notices (exact count) in one grid cell; Flood Ready → 100% floodplain overlap cell. All three are geographically plausible (e.g. the vacancy hotspot lands in West Baltimore, consistent with well-documented vacancy patterns).
  - `docs/DATA_SOURCES.md` auto-generated with the exact URLs, layer names, and method used.
  - DATA-mode map renders the real hotspot GeoJSON as actual layers (`src/map/dataOverlays.ts`) — green fill for canopy, orange points for vacancy, blue fill for floodplain — not just abstract circles.
- **marimo Data Command Center** (`analysis/better_baltimore.py`), verified running via `marimo run`: dataset selector → provenance card, interactive geospatial chart of the real hotspot geometry, baseline metric chart, intervention slider driving a `simulate()` that mirrors `src/simulation/engine.ts` exactly, before/after chart, assumptions section. Runs in an isolated `.venv` (this machine's system pandas/numpy have an ABI conflict — see below).
- **Civic Copilot** (`src/ai/`): lexical evidence retrieval over live mission/source data, "Evidence Explorer" mode (no LLM key configured in this environment, so this is what actually runs — a complete, correct implementation per spec). Verified live with real retrieved evidence.
- **City Memory** — Artscape (verified via live web search: Baltimore's free outdoor arts festival, May 23–24, 2026, organized by the Baltimore Office of Promotion & the Arts): marker, factual summary + source link, "Relive this moment" narrative clearly labeled illustrative.
- **Real mobile-layout bug found and fixed**: below 900px, the mission panel had no height cap and squeezed the map's row to a computed 0px height whenever it was open. Fixed with height caps + independent scrolling on both sidebar and panel.
- Clean-install verified (`rm -rf node_modules && npm ci` → typecheck/tests/build all pass).
- Devpost submission copy drafted at [`docs/SUBMISSION.md`](../docs/SUBMISSION.md) with this build's real, verified specifics.

## Deployment decision: local-only, deliberately
Per the execution plan's explicit fallback rule and the demo script's framing (a recorded walkthrough, not necessarily a hosted link) — the app runs fully locally (frontend + local SpacetimeDB + local marimo), which is explicitly sufficient. Publishing to SpacetimeDB Maincloud or a static frontend host was not attempted since it requires creating a new account/login — your call, not assumed, same as `gh auth login` earlier.

## Current tests
- `npx vitest run` — 6/6 passing.
- `npx tsc -b`, `npm run build` — clean.
- `spacetime build` — clean; local DB republished with real seed data.
- marimo notebook manually verified in-browser: all cells render with no errors.

## Known issues / environment notes
- **marimo cell-scoping gotcha (fixed):** code outside `@app.cell` blocks is invisible to cells that reference it — caused a silent `NameError` partway through the notebook. All live code must be inside a cell.
- **System Python ABI conflict:** this Jetson's apt-installed `pandas` conflicts with pip-installed `numpy`. Worked around with an isolated `.venv` rather than touching the shared system Python.
- React 18/19 StrictMode double-invokes the SpacetimeDB connection effect in dev, logging one harmless cancelled-connection warning per mount. Dev-only, not present in production builds.

## Blockers
None — the map bug above is fixed at the code level; only visual confirmation remains, and that's a quick check, not a blocker on further work.

## What's left (manual, needs you)
1. **Hard-refresh and confirm the map visually renders** in REALITY/DATA/BETTER modes.
2. **Record the 90–120s demo** using the script in `07_DEMO_AND_SUBMISSION.md`.
3. **Paste the video link into `docs/SUBMISSION.md`** and submit on Devpost.

## Demo readiness
Everything is built, tested, and verified except the one visual confirmation above. Once that's done: record, submit.
