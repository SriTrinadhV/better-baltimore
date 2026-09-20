# Better Baltimore — Status

## Current phase
Phase 2 complete (of 9). Starting Phase 3 (real Baltimore open data ingestion).

## Completed functionality
- Vite + React + TypeScript app shell, dark civic-tech theme.
- MapLibre GL JS + OpenFreeMap ("liberty" style) whole-city 3D map, centered on Baltimore, with 3D building fill-extrusion layer.
- `REALITY | DATA | BETTER` mode switch, camera-preserving where possible.
- Six mission markers with category colors, mission list sidebar with fly-to.
- Full mission detail panel: summary, "why here?", observed metrics, source panel (observed/derived/simulated labels), intervention picker, deterministic before/after simulation with assumptions.
- Deterministic local simulation engine (`src/simulation/engine.ts`) covering all six missions, with unit tests (including a regression test for correct observed-vs-simulated provenance labeling).
- **SpacetimeDB is now the authoritative backend** (Phase 2):
  - Local SpacetimeDB v2.10.1 (aarch64-unknown-linux-gnu) running natively on this Jetson at `~/.local/bin/spacetime` — no cloud dependency.
  - TypeScript server module (`spacetimedb/src/index.ts`) with tables `player_session`, `mission`, `intervention`, `mission_state`, `simulation_run`, `data_source`, `city_memory`, and reducers `ensure_session`, `set_mode`, `seed_data_source`, `seed_mission`, `seed_intervention`, `seed_city_memory`, `choose_intervention`, `run_simulation`, `reset_mission`.
  - Published locally as database `better-baltimore`; TypeScript client bindings generated into `src/spacetime/module_bindings/`.
  - Frontend (`src/data/client.ts` — `useSpacetimeData()`) connects, subscribes to all game tables, auto-seeds on first empty connection, and drives all mutations through reducers.
  - **Verified live**: fresh browser tab with zero interaction correctly shows a mission already marked "done" from a different tab's completed simulation — real-time multi-client sync confirmed via SQL (`spacetime sql`) and multi-tab browser testing.
- Landing screen with "Explore Baltimore" / "Open Data Command Center" entry points.

## Current tests
- `npx vitest run` — 6/6 passing.
- `npx tsc -b` — clean (frontend + SpacetimeDB module).
- `npm run build` — succeeds (one non-blocking chunk-size warning, addressable in Phase 7 polish).
- `spacetime build` (module) — clean.
- Manually verified in browser: landing → explore → mission click → intervention select → run simulation → before/after table with correct provenance → mission "done" badge, confirmed persisted server-side via `spacetime sql` and visible instantly in an independent fresh tab.

## Known issue / environment note
The embedded preview-pane browser used for automated verification in this session does not support ES module Web Workers, which blocks MapLibre GL's internal worker pool — the map never fires its `load` event in that sandbox specifically (confirmed via direct Worker construction test; classic workers work fine there). This is standard, widely-supported browser functionality (Chrome/Firefox since ~2020) and did not reproduce as a code-level bug — reproduced identically in both Vite dev and a production `vite build` + `vite preview` serve. **Action item:** confirm the 3D map renders correctly in the Jetson's actual desktop browser before the demo.

React 18/19 StrictMode double-invokes the SpacetimeDB connection effect in dev, logging one harmless "WebSocket is closed before the connection is established" / "SpacetimeDB connection error" pair per mount (first connection attempt is cancelled by cleanup before its handshake completes; the second succeeds and is what the UI uses). This is dev-only StrictMode behavior and does not occur in production builds.

## Blockers
None current. Both items above are verification/cosmetic notes, not known-broken features.

## Next action
Phase 3: fetch real Baltimore City open data (Tree Canopy, Vacant Building Notices, Floodplain), normalize to `public/data/`, derive stable demo hotspots, and replace the three deep missions' temporary coordinates + `pending verification` source metadata with real, sourced values.

## Demo readiness
Core vertical slice + real-time shared backend work locally. Still needed: real Baltimore data (currently seed/placeholder coordinates and metrics), marimo notebook, polish, deploy.
