# Better Baltimore — Status

## Current phase
Phase 1 complete (of 9). Starting Phase 2 (SpacetimeDB backend).

## Completed functionality
- Vite + React + TypeScript app shell, dark civic-tech theme.
- MapLibre GL JS + OpenFreeMap ("liberty" style) whole-city 3D map, centered on Baltimore, with 3D building fill-extrusion layer.
- `REALITY | DATA | BETTER` mode switch, camera-preserving where possible.
- Six mission markers (temporary coordinates) with category colors.
- Mission list sidebar with fly-to on selection.
- Full mission detail panel: summary, "why here?", observed metrics, source panel (observed/derived/simulated labels), intervention picker, deterministic before/after simulation with assumptions.
- Deterministic local simulation engine (`src/simulation/engine.ts`) covering all six missions, with unit tests.
- Local SpacetimeDB CLI (v2.10.1, aarch64-unknown-linux-gnu) installed at `~/.local/bin/spacetime` — confirmed working natively on this Jetson, no cloud fallback needed.
- Landing screen with "Explore Baltimore" / "Open Data Command Center" entry points.

## Current tests
- `npx vitest run` — 6/6 passing (simulation engine: bounded output, provenance labeling, determinism).
- `npx tsc -b` — clean.
- `npm run build` — succeeds (one non-blocking chunk-size warning, addressable in Phase 7 polish).
- Manually verified in browser: landing → explore → mission click → intervention select → run simulation → before/after table, mission marked "done" in sidebar.

## Known issue / environment note
The embedded preview-pane browser used for automated verification in this session does not support ES module Web Workers (`new Worker(url, {type: "module"})` fails silently), which blocks MapLibre GL's internal worker pool and so the map never fires its `load` event in that sandbox specifically. Module workers are standard in real Chrome/Chromium/Firefox (supported since ~2020) and this did not reproduce as a code-level bug — it did not depend on Vite dev vs. production build. **Action item:** confirm the 3D map renders correctly in the Jetson's actual desktop browser before the demo; if it does not, investigate `maplibregl.workerUrl` / a classic-worker shim as a fallback.

## Blockers
None current. The item above is a verification gap, not a known-broken feature.

## Next action
Phase 2: SpacetimeDB schema + reducers (`player_session`, `mission`, `mission_state`, `intervention`, `simulation_run`, `data_source`, `city_memory`), replace local React state mutation with reducer calls + subscriptions.

## Demo readiness
Not yet demo-ready. Core vertical slice works locally with seed data; no real Baltimore data, no backend persistence, no marimo notebook yet.
