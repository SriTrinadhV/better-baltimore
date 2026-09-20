# Better Baltimore — Status

## Current phase
Phase 7 complete (of 9). Starting Phase 8 (reliability + deploy).

## Completed functionality
- Vite + React + TypeScript app shell, MapLibre + OpenFreeMap 3D Baltimore map, REALITY/DATA/BETTER modes, six mission markers, full mission flow, deterministic simulation engine (unit tested).
- SpacetimeDB is the authoritative backend (local, ARM64-native, verified multi-client sync).
- **Phase 3 — real Baltimore City open data** now backs all three deep missions:
  - `scripts/lib.py` + `scripts/derive_hotspots.py`: scans a 6x6 grid over Baltimore, querying the three verified live ArcGIS layers (Tree Canopy, Vacant Building Notices, Floodplain) per cell with an intersecting-envelope spatial filter (not a full citywide dump), and picks the top-scoring cell per mission.
  - Fixed two real data-integrity bugs caught during derivation: (1) vacant-building counts were silently capped at ArcGIS's 1000-record page size — now uses a `returnCountOnly` query for the true count; (2) polygon overlay files (floodplain especially) shipped each intersecting feature's *entire* unclipped geometry, producing a 14MB file — now clipped to the query cell and simplified before writing.
  - Real derived results: Cool the Block → 0.2% canopy coverage cell; Reclaim the Lot → 3,197 vacant building notices (exact count) in one grid cell; Flood Ready → 100% floodplain overlap cell. All three are geographically plausible (matches known Baltimore geography — e.g. the vacancy hotspot lands in West Baltimore, consistent with well-documented vacancy patterns).
  - `docs/DATA_SOURCES.md` auto-generated with the exact URLs, layer names, and method used.
  - Frontend now imports `src/data/hotspots.generated.json` and merges it into the three deep missions' lat/lng/baseline metrics/"why here" text (`src/data/missions.seed.ts`).
  - DATA-mode map now renders the real hotspot GeoJSON as actual layers (`src/map/dataOverlays.ts`) — green fill for canopy, orange points for vacancy, blue fill for floodplain — not just abstract circles.
- **Phase 5 — marimo Data Command Center** (`analysis/better_baltimore.py`), verified running via `marimo run`:
  - Dataset selector → provenance card (observed/derived/simulated + source link).
  - Interactive geospatial chart of the actual hotspot GeoJSON (Altair `mark_geoshape`/`mark_circle`).
  - "Why here?" + grid-cell explanation, baseline metric bar chart.
  - Intervention slider driving a `simulate()` function that mirrors `src/simulation/engine.ts`'s formulas exactly, before/after faceted bar chart.
  - Assumptions section.
  - Runs in an isolated `.venv` (created to avoid a broken system pandas/numpy ABI conflict on this shared machine — see below).

## Phase 6 — Civic Copilot + City Memory
- **Civic Copilot** (`src/ai/corpus.ts`, `retrieve.ts`, `explain.ts`, `src/components/CivicCopilot.tsx`): builds a small evidence corpus from live mission/source/intervention/assumption data, retrieves the top matches with lexical term-overlap scoring (no vector DB, per spec), and answers as an "Evidence Explorer" — no LLM key is configured in this environment, so this fallback path is what actually runs, and it's a complete, correct implementation per the spec ("the feature still works without an API key"). If `VITE_GEMINI_API_KEY` is ever set, it asks Gemini to summarize the same retrieved evidence only; documented in `.env.example` that this embeds the key client-side (acceptable for a hackathon demo with a restricted key, not for production without a backend proxy). Verified live: asking "Why is Cool the Block here?" correctly retrieves the mission's real derived why-here text, its intervention, and its real baseline metrics.
- **City Memory** — Artscape (verified via live web search: nation's largest free outdoor arts festival, May 23–24, 2026, downtown Baltimore near City Hall, organized by the Baltimore Office of Promotion & the Arts, official site artscape.org): a distinct purple star marker, `CityMemoryPanel` with factual summary + source link + a "Relive this moment" button that reveals a short, clearly-labeled-as-illustrative narrative (not a recreation of any specific copyrighted performance). Seeded through the same SpacetimeDB `city_memory` table/`seed_city_memory` reducer built in Phase 2.

## Phase 7 — polish
- **Real mobile/narrow-viewport bug found and fixed**: below the 900px breakpoint, the app switches to a stacked (not side-by-side) layout for sidebar/map/mission-panel. The mission panel had no height cap, so its `auto` grid row grew to consume the *entire* remaining space, squeezing the map's `1fr` row down to a computed **0px** — the map was completely invisible whenever a mission panel was open on a narrow screen. Confirmed via `getComputedStyle(...).gridTemplateRows` showing `"243px 0px 380px"`. Fixed by capping both the sidebar (22vh) and mission panel (32vh) on narrow viewports, each independently scrollable, guaranteeing the map a real share of the height. Also fixed the footer legend wrapping under the fixed Civic Copilot button on narrow screens.
- Split the production bundle: `maplibre-gl` and `spacetimedb` now build as separate chunks via `vite.config.ts` `manualChunks`, dropping the main app chunk from 1.39MB to ~260KB (maplibre's own chunk is still large — that's inherent to a WebGL mapping library — but now caches independently from app code).

## Phase 4 note
The "complete all six missions" acceptance gate was already satisfied back in Phase 1 (all six missions have interventions and a working simulate → before/after flow; three deep + three clearly-labeled scenario missions). What Phase 3 added on top: the three deep missions now use real coordinates/metrics instead of placeholders, and DATA view shows real overlay geometry. Remaining Phase 4 scope (richer Better-view visual treatment per mission) is lighter-weight polish, deferred to Phase 7 if time allows.

## Current tests
- `npx vitest run` — 6/6 passing (one test updated: it hardcoded an assumption tied to the old placeholder vacancy baseline of 14; fixed to compute against the mission's actual baseline instead of a magic number, since real data is now 3,197).
- `npx tsc -b`, `npm run build` — clean.
- `spacetime build` — clean; local DB wiped and republished with real seed data (`spacetime publish better-baltimore --server local --delete-data=always -y`).
- marimo notebook manually verified in-browser: all cells render (map, metrics, slider, before/after) with no errors, after fixing a marimo-specific bug (see below).

## Known issues / environment notes
- **marimo cell-scoping bug (fixed):** initial version of the notebook defined two lookup dicts and the `simulate()` helper as plain top-level module code between `@app.cell` blocks. marimo only executes code inside `@app.cell` functions — those definitions were silently invisible to cells that referenced them, causing an unhandled `NameError` partway through the notebook (visible only as a generic "An internal error occurred" banner, with several cells simply not rendering). Fixed by moving them into their own cells. Worth remembering for any future marimo work: **all live code must be inside a cell**, even simple constants.
- **System Python ABI conflict:** this Jetson's apt-installed `pandas` (`/usr/lib/python3/dist-packages`) is binary-incompatible with the pip-installed `numpy` already on the system (`numpy.dtype size changed` error). Worked around with an isolated `.venv` for `analysis/` and `scripts/` rather than touching the shared system Python — safer on a machine with another user's global setup. Anyone running the notebook or data scripts should `source .venv/bin/activate` first (or create their own venv from `analysis/requirements.txt` / `scripts/requirements.txt`).
- The embedded preview-pane browser used for automated verification in this session cannot run MapLibre's module Web Workers (confirmed via direct `new Worker(url, {type:"module"})` test — fails identically in dev and production builds). This is standard browser functionality elsewhere; **please spot-check the 3D map renders in the Jetson's actual desktop browser before demo day.**
- React 18/19 StrictMode double-invokes the SpacetimeDB connection effect in dev, logging one harmless cancelled-connection warning per mount. Dev-only, not present in production builds.

## Blockers
None current — all items above are resolved or are verification/cosmetic notes.

## Next action
Phase 6: one advanced AI feature (Civic Copilot, RAG-lite over mission/source evidence — works with or without a Gemini key) + one City Memory. After that: Phase 7 polish, Phase 8 reliability/deploy, Phase 9 submission.

## Demo readiness
Core vertical slice + real-time backend + real Baltimore data (3 deep missions) + marimo notebook all work locally and are verified end-to-end. Still needed: Civic Copilot, City Memory, polish pass, deploy, submission materials.
