# HopHacks Submission — Better Baltimore

Draft Devpost copy. Fill in the demo video URL once recorded (see "What's left" at the bottom) and paste this into Devpost.

## Title
Better Baltimore

## One-sentence pitch
Better Baltimore turns Baltimore City's open civic data into an explorable 3D city where real datasets identify problems, players test interventions, and a deterministic scenario model shows what a better Baltimore could look like.

## Track
Best Data Visualization

## Inspiration
Baltimore City publishes rich open datasets — tree canopy, vacant buildings, floodplain maps, and more — through its GIS and Open Baltimore portals. Almost nobody outside city planning departments ever looks at them directly: they live in ArcGIS REST endpoints and raw GeoJSON, not anywhere a resident would think to check. We wanted to turn that same data into a place you can walk through instead of a table you have to query.

## What it does
Better Baltimore renders the whole city in 3D (MapLibre GL JS + OpenFreeMap) and puts six civic missions on the map, each targeting a real category of problem: tree canopy, vacant buildings, sanitation, floodplain exposure, parking pressure, and street safety. Three of them — Cool the Block, Reclaim the Lot, and Flood Ready — are backed by real, live-queried Baltimore City open data, not placeholder coordinates.

Three view modes tell the same story three ways:
- **Reality** — the city as it is, with mission markers.
- **Data** — the actual underlying dataset rendered as a map layer (tree canopy polygons, vacant-building points, floodplain polygons), with a legend.
- **Better** — the same location after a player-chosen intervention, with a transparent before/after comparison.

Every number on screen is labeled **observed** (straight from the dataset), **derived** (our calculation from it), or **simulated** (a hypothetical outcome from the chosen intervention) — never blurred together.

## How we built it
- **Frontend**: React + TypeScript + Vite, MapLibre GL JS + OpenFreeMap for the 3D city and building extrusions.
- **Backend**: SpacetimeDB (v2.10.1, running natively on ARM64) is the authoritative game state — a TypeScript server module defines 7 tables and 9 reducers (missions, interventions, mission state, simulation runs, data sources, city memories, sessions), and the React client subscribes for real-time updates. Verified live: completing a mission in one browser tab instantly updates a second, independent tab through SpacetimeDB's subscription system.
- **Data pipeline**: a Python script (`scripts/derive_hotspots.py`) scans a grid over Baltimore against three live Baltimore City ArcGIS layers — Tree Canopy, Vacant Building Notices, and Floodplain — scoring each cell and picking the real hotspot for each deep mission, rather than hand-placing markers.
- **Simulation engine**: deterministic, mission-specific formulas (`src/simulation/engine.ts`) — no LLM ever computes or alters a number. The exact same formulas are re-implemented in the marimo notebook so the two tell a consistent story.
- **marimo Data Command Center** (`analysis/better_baltimore.py`): a dataset selector, a live geospatial chart of the real hotspot geometry, a baseline metrics chart, an intervention slider, and a before/after chart — using the same normalized data as the 3D game.
- **Civic Copilot**: a lexical (no vector DB) retrieval-augmented explainer over the app's own mission/source/assumption data. Runs as a pure "Evidence Explorer" by default; can optionally summarize the same evidence through Gemini if an API key is supplied, but is never allowed to invent a number.
- **City Memory**: one factual civic memory (Artscape, Baltimore's free outdoor arts festival) with a real source link and a clearly-labeled illustrative "relive" narrative — not a recreation of any specific copyrighted performance.

## Real Baltimore datasets used
- **Tree Canopy** — `geodata.baltimorecity.gov/.../dmxBoundaries/MapServer/27`. Our grid scan found a cell with 0.2% canopy coverage (lowest of 36 cells scanned) → the Cool the Block hotspot.
- **Vacant Building Notices** — `egisdata.baltimorecity.gov/.../DHCD_Open_Baltimore_Datasets/FeatureServer/1`. 3,197 vacant building notices (exact count via an ArcGIS `returnCountOnly` query, not an estimate) in one grid cell → the Reclaim the Lot hotspot.
- **Floodplain** — `egis.baltimorecity.gov/.../dmxCityPrograms/MapServer/25`. A cell with 100% floodplain overlap → the Flood Ready hotspot.

Full URLs, retrieval date, and method are in [`docs/DATA_SOURCES.md`](DATA_SOURCES.md).

## Challenges we ran into
- ArcGIS silently caps query results at its `maxRecordCount` (1000 for the vacancy layer) — our first pass reported "1000 vacant buildings" as an exact observed fact, which would have been a data-integrity error. Fixed by using a separate `returnCountOnly` query for the true count (3,197).
- The same issue nearly shipped a 14MB map overlay file: a floodplain polygon's true geometry extends far beyond the query cell, so writing each intersecting feature's *full* geometry (rather than clipping it to the cell) produced a huge file. Fixed by clipping and simplifying before writing — 14MB became ~120KB.
- marimo only executes code inside `@app.cell` functions; a lookup dict and helper function we'd written as plain module-level code between cells were silently invisible to cells that referenced them, breaking half the notebook with no clear error.
- This machine's system-installed `pandas` and a pip-installed `numpy` had a binary ABI conflict; solved with an isolated virtualenv rather than touching the shared system Python.

## Accomplishments we're proud of
- Real, live-verified Baltimore City data drives real mission placement — not hand-picked coordinates — and we caught and fixed two genuine data-integrity bugs in that pipeline before they could misrepresent city data as more precise than it was.
- A working, verified real-time multi-client backend: SpacetimeDB reducers and subscriptions actually sync state across independent browser sessions.
- Every single number in the UI carries an honest observed/derived/simulated label, enforced by a shared type system and caught by a regression test after we found one mislabeled metric during manual testing.

## What's next
- Verify a current 311/service-request source and back the three lighter missions (Clean the Streets, Park Smarter, Safer Streets) with real data the same way.
- Publish the SpacetimeDB module to Maincloud for a judge-accessible hosted demo, not just local.
- Higher-resolution grid scan for hotspot derivation, and a second City Memory.

## Links
- Repository: https://github.com/SriTrinadhV/better-baltimore
- Demo video: _(record and paste link here — see STATUS.md "Phase 8" for what's still needed)_

## What's left before this is submission-ready
1. Confirm the 3D map renders correctly in a real browser on this machine (this session's automated browser sandbox can't run MapLibre's WebGL worker — see `STATUS.md`).
2. Record the 90–120s demo per the script in `07_DEMO_AND_SUBMISSION.md`.
3. Paste the video link above and submit on Devpost.
