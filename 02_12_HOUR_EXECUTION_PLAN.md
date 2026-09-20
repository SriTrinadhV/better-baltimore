# Better Baltimore — 12-Hour Execution Plan

## Goal
Finish a polished, stable, submittable project. Each phase is a **bundle** that produces a working vertical slice, not a collection of isolated setup tasks.

The clock is the product manager.

---

## PHASE 0 — 0:00–0:30
### Create the shippable skeleton
Complete all of this in one pass:
- initialize Git repo,
- create React + TypeScript frontend,
- add MapLibre GL JS,
- connect OpenFreeMap style,
- create basic app shell,
- add `Reality | Data | Better` switch,
- add placeholder mission model/types,
- create `/analysis` directory for marimo,
- create `/spacetimedb` module,
- create `.env.example`,
- create `README.md`,
- create `STATUS.md`.

Immediate test:
- app runs,
- Baltimore is centered,
- map loads,
- mode switch works.

Commit:
`feat: initialize Better Baltimore app and 3D map shell`

**If this is not green by 0:30, stop styling and fix it.**

---

## PHASE 1 — 0:30–2:00
### Build the complete front-end game loop with local seed data first
Do NOT wait for backend/data ingestion before proving the UX.

In one phase:
1. Add 3D building extrusions using OpenFreeMap/MapLibre.
2. Add six mission markers using temporary Baltimore coordinates.
3. Add mission list and fly-to.
4. Build mission detail panel:
   - description,
   - observed metrics,
   - source section,
   - interventions,
   - run simulation,
   - before/after metrics.
5. Implement all three view modes.
6. Build a deterministic local simulation engine.
7. Make at least one mission produce a visible Better-view map change.
8. Add responsive UI.
9. Add loading/error state.

Acceptance gate:
- user can explore 3D Baltimore,
- click mission,
- choose intervention,
- see before/after,
- switch Reality/Data/Better,
- no console-breaking errors.

Commit:
`feat: complete 3D mission and intervention vertical slice`

Do not perfect visuals yet.

---

## PHASE 2 — 2:00–3:30
### Make SpacetimeDB the authoritative backend
Build backend and replace local mutation state.

Create tables:
- `player_session`
- `mission`
- `mission_state`
- `intervention`
- `simulation_run`
- `data_source`
- `city_memory`
- optional `world_metric`

Create reducers:
- `ensure_session`
- `seed_mission`
- `choose_intervention`
- `run_simulation`
- `reset_mission`
- `seed_data_source`
- `seed_city_memory`

Use subscriptions:
- missions,
- mission state,
- simulation runs,
- city memories.

The frontend should:
- connect,
- show connection state,
- populate mission UI from DB,
- run mutations through reducers,
- update reactively.

Demo test:
1. open two tabs,
2. change mission state in tab A,
3. tab B receives update.

Fallback:
- if cloud publish is blocking, run local SpacetimeDB and continue.
- do not swap to another database.

Commit:
`feat: move mission and world state to SpacetimeDB`

---

## PHASE 3 — 3:30–5:30
### Ingest real Baltimore data and generate three real hotspot missions
This is the most important Data-track phase.

Priority datasets:
1. Tree Canopy.
2. Vacant Building Notices.
3. Floodplain.
4. 311/service requests only after the first three work.

Create data scripts:
- fetch ArcGIS `query` endpoint,
- request GeoJSON,
- project/normalize to EPSG:4326 if needed,
- simplify geometry aggressively,
- derive hotspot/mission inputs,
- write normalized output to `/public/data` for marimo and seed it into SpacetimeDB.

Do NOT send huge raw city datasets into SpacetimeDB.
Store:
- source metadata,
- selected hotspot,
- summarized metrics,
- simplified mission geometry.

Deep mission mapping:
- Tree Canopy -> Cool the Block
- Vacant Buildings -> Reclaim the Lot
- Floodplain -> Flood Ready

Replace temporary coordinates with data-derived stable demo hotspots.

UI additions:
- “Why here?”
- source URL
- measured/derived/simulated labels.

Acceptance gate:
- three missions can be traced to real Baltimore City datasets,
- source panel works,
- Data view shows at least two real data overlays,
- normalized data exists locally for marimo.

Commit:
`feat: derive Baltimore mission hotspots from open civic data`

---

## PHASE 4 — 5:30–7:00
### Complete all six missions and the Better Baltimore simulation layer
Now finish the breadth.

Three deep real-data missions:
- Cool the Block
- Reclaim the Lot
- Flood Ready

Three lighter missions:
- Clean the Streets
- Park Smarter
- Safer Streets

If 311 is working, use it for the lighter missions.
If not, clearly label those as `Scenario simulation` and do not present invented values as measured city facts.

Implement a unified simulation schema:
```ts
{
  baseline: Metric[],
  intervention: Intervention,
  after: Metric[],
  assumptions: string[],
  confidence: "illustrative" | "low" | "medium" | "high"
}
```

Better-view visual changes:
- tree/green overlay,
- vacancy state change,
- flood intervention geometry,
- density fade/redistribution for lighter missions.

Add “Scenario impact” summary.

Acceptance gate:
- all six mission markers work,
- all six have interventions,
- at least three have real source panels,
- no dead-end mission.

Commit:
`feat: complete six Better Baltimore civic missions`

---

## PHASE 5 — 7:00–8:00
### Build the marimo Data Command Center
This is mandatory for the Data Visualization track.

Create:
`analysis/better_baltimore.py`

It must run independently:
`marimo run analysis/better_baltimore.py`

Include:
- title + project explanation,
- dataset selector,
- mission selector,
- interactive map/geospatial plot,
- table or summary metrics,
- intervention slider/choice,
- before/after chart,
- source/provenance block.

Use the same normalized data files generated in Phase 3.

Prefer:
- pandas/polars,
- altair/plotly,
- geopandas only if installation does not become a blocker.

Avoid a heavy dependency stack if simple GeoJSON + pandas works.

Acceptance gate:
- a judge can use the notebook without touching code,
- changing a control updates a visualization,
- at least three Baltimore datasets are represented.

Commit:
`feat: add interactive marimo civic data command center`

---

## PHASE 6 — 8:00–9:00
### Add one advanced AI feature + one City Memory
Only do this after all previous gates are green.

#### AI feature: Civic Copilot (RAG-lite)
Purpose:
Answer:
- “Why is this mission here?”
- “What does this dataset show?”
- “What assumptions are in this simulation?”
- “Why might this intervention help?”

Architecture:
1. Build a small corpus from:
   - dataset metadata,
   - mission source notes,
   - mission metrics,
   - simulation assumptions.
2. Retrieve top relevant chunks with a simple local lexical/BM25-style scorer.
3. If a Gemini key is available, send retrieved context to Gemini for explanation.
4. If no key exists, show retrieved evidence directly as an “Evidence answer.”

Do not build Pinecone/Weaviate/etc. in a 12-hour hack unless everything else is finished.

#### City Memory
Implement ONE polished memory:
- marker,
- factual source,
- fly-to,
- event overlay/state,
- short “relive” presentation.

Optional second memory only if time remains.

Commit:
`feat: add civic copilot and city memory experience`

---

## PHASE 7 — 9:00–10:00
### Polish the judge path
No new infrastructure.

Polish:
- landing screen,
- typography,
- map legend,
- mission icons,
- loading skeleton,
- error messages,
- source badges,
- labels for observed/derived/simulated,
- camera transitions,
- mobile sanity check,
- empty-state handling,
- tooltips,
- SpacetimeDB connected badge.

Add “Demo Route” shortcut:
1. Cool the Block.
2. Run intervention.
3. switch Data/Better.
4. Reclaim the Lot.
5. City Memory.

Performance:
- simplify GeoJSON,
- lazy-load overlays,
- remove unnecessary data,
- confirm smooth map movement.

Commit:
`chore: polish Better Baltimore judge experience`

**Hard feature freeze at 10:00.**

---

## PHASE 8 — 10:00–11:00
### Reliability, deploy, and fallback
Run:
- typecheck,
- unit tests for simulation formulas,
- backend reducer tests or CLI checks,
- clean install/build,
- production build,
- browser console check.

Deploy:
- frontend to a fast static host.
- SpacetimeDB to cloud if ready; otherwise use local backend for recorded/live demo.
- marimo separately if easy, otherwise run locally during judging.

Create fallback assets:
- 60–90 second screen recording.
- screenshots of Reality/Data/Better.
- screenshot of marimo.
- local run instructions.

Commit:
`test: stabilize production demo and deployment`

---

## PHASE 9 — 11:00–12:00
### Submit
Do not code unless fixing a demo-breaking bug.

Prepare:
- Devpost title.
- one-sentence pitch.
- problem.
- what it does.
- how it works.
- Baltimore datasets used.
- SpacetimeDB explanation.
- marimo explanation.
- challenges.
- accomplishments.
- what's next.
- source links.
- repository.
- demo URL/video.

Record demo using the script in `07_DEMO_AND_SUBMISSION.md`.

Final commit:
`docs: finalize HopHacks submission`

Push everything.

---

# Priority ladder

## P0 — must work
- 3D Baltimore
- 3 modes
- 6 markers
- 3 deep missions
- SpacetimeDB
- Baltimore open data
- marimo
- before/after simulation
- source provenance
- demo

## P1 — do if P0 green
- 311-backed lighter missions
- Civic Copilot
- multiplayer live update
- 1 City Memory
- polished transitions

## P2 — only if ahead
- second City Memory
- mission hotspot auto-generation for all six
- WASD/free-camera mode
- LLM-generated mission narrative
- advanced clustering
- event/news ingestion
- custom 3D landmark models

If a P2 feature threatens P0, delete it immediately.
