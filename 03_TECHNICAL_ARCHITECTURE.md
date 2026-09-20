# Better Baltimore — Technical Architecture

## Recommended stack

### Frontend
- React
- TypeScript
- Vite
- MapLibre GL JS
- OpenFreeMap vector tiles
- CSS/Tailwind or simple CSS modules
- optional: Turf.js for geospatial calculations

Why:
MapLibre can render a whole city, supports pitch/bearing/fly-to, GeoJSON overlays, heatmaps, fill extrusions, and 3D buildings without manually building a 3D engine.

### 3D city
Use OpenFreeMap as the visual basemap and building source.
Add a `fill-extrusion` building layer from the `building` source layer.

This gives:
- whole-city coverage,
- low-complexity 3D,
- geographic recognizability,
- fast implementation.

Do not use Three.js as the primary city renderer in the 12-hour build.
Three.js may be used only for optional custom landmark models after the core is complete.

### Backend
- SpacetimeDB 2.x
- TypeScript database module
- TypeScript React client SDK
- reducers for every state mutation
- query subscriptions for real-time state

### Data preprocessing
- Python or TypeScript scripts
- ArcGIS REST `query` endpoints returning GeoJSON
- compact normalized JSON written to `public/data/`
- seed summarized mission data into SpacetimeDB

Python is reasonable because marimo already requires Python.

### Data notebook
- marimo
- pandas
- Altair/Plotly
- optional GeoPandas only if it installs cleanly

### AI
Optional after core:
- Gemini API for narrative/explanation
- local retrieval over curated source chunks
- deterministic simulation remains outside the LLM

---

# Repository layout

```text
better-baltimore/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.ts
│  │  └─ types.ts
│  ├─ components/
│  │  ├─ CityMap.tsx
│  │  ├─ ModeSwitch.tsx
│  │  ├─ MissionPanel.tsx
│  │  ├─ MissionList.tsx
│  │  ├─ SourcePanel.tsx
│  │  ├─ InterventionPicker.tsx
│  │  ├─ BeforeAfter.tsx
│  │  ├─ CityMemoryPanel.tsx
│  │  └─ CivicCopilot.tsx
│  ├─ map/
│  │  ├─ layers.ts
│  │  ├─ missions.ts
│  │  ├─ camera.ts
│  │  └─ betterView.ts
│  ├─ simulation/
│  │  ├─ engine.ts
│  │  ├─ models.ts
│  │  └─ __tests__/
│  ├─ data/
│  │  ├─ client.ts
│  │  └─ provenance.ts
│  ├─ spacetime/
│  │  ├─ connection.ts
│  │  └─ module_bindings/   # generated
│  └─ ai/
│     ├─ retrieve.ts
│     ├─ corpus.ts
│     └─ explain.ts
├─ spacetimedb/
│  └─ src/
│     └─ index.ts
├─ analysis/
│  └─ better_baltimore.py
├─ scripts/
│  ├─ fetch_tree_canopy.py
│  ├─ fetch_vacancy.py
│  ├─ fetch_floodplain.py
│  ├─ fetch_311.py
│  ├─ derive_hotspots.py
│  └─ build_corpus.py
├─ public/
│  └─ data/
│     ├─ sources.json
│     ├─ missions.json
│     ├─ tree_hotspots.geojson
│     ├─ vacant_hotspots.geojson
│     └─ floodplain_simplified.geojson
├─ docs/
│  ├─ DATA_SOURCES.md
│  └─ DEMO.md
├─ .env.example
├─ STATUS.md
└─ README.md
```

---

# SpacetimeDB data model

Keep the schema small.

## `player_session`
Fields:
- `identity`
- `display_name`
- `joined_at`
- `selected_mission_id`
- `current_mode`

## `mission`
Fields:
- `id`
- `slug`
- `title`
- `category`
- `lat`
- `lng`
- `summary`
- `data_source_id`
- `evidence_json`
- `status`
- `is_deep`

## `intervention`
Fields:
- `id`
- `mission_id`
- `key`
- `title`
- `description`
- `parameters_json`

## `mission_state`
Fields:
- `mission_id`
- `selected_intervention_id`
- `status`
- `scenario_score`
- `updated_at`
- `updated_by`

## `simulation_run`
Fields:
- `id`
- `mission_id`
- `intervention_id`
- `baseline_json`
- `result_json`
- `assumptions_json`
- `created_at`
- `created_by`

## `data_source`
Fields:
- `id`
- `name`
- `publisher`
- `url`
- `retrieved_at`
- `updated_at_text`
- `notes`

## `city_memory`
Fields:
- `id`
- `title`
- `category`
- `lat`
- `lng`
- `event_date`
- `summary`
- `source_url`
- `scene_json`

Avoid putting large GeoJSON blobs in rows unless small enough for the demo.
Serve map overlay files statically and store only IDs/URLs/summary state in SpacetimeDB.

---

# Reducer contract

All writes go through reducers.

Required:
- `ensure_session(display_name?)`
- `seed_data_source(...)`
- `seed_mission(...)`
- `seed_intervention(...)`
- `choose_intervention(mission_id, intervention_id)`
- `run_simulation(mission_id, intervention_id, result_json, assumptions_json)`
- `reset_mission(mission_id)`
- `set_mode(mode)`
- `seed_city_memory(...)`

Validation:
- mission must exist,
- intervention must belong to mission,
- simulation payload must have bounded numeric values,
- reject invalid JSON size,
- never trust client-provided “observed data” values if server has stored baseline.

---

# Subscription design

Client subscribes to:
- all missions,
- interventions,
- mission state,
- latest simulation runs,
- city memories,
- current session.

On update:
- map marker state changes,
- Better view rerenders,
- mission panel updates.

Multi-tab demo:
- tab B updates after reducer mutation in tab A.

---

# Simulation engine

Do not build a “city physics engine.”

Use mission-specific deterministic functions behind one common interface.

```ts
type Metric = {
  key: string;
  label: string;
  value: number;
  unit: string;
  provenance: "observed" | "derived" | "simulated";
};

type SimulationInput = {
  missionId: string;
  baseline: Metric[];
  interventionKey: string;
  parameters: Record<string, number>;
};

type SimulationResult = {
  before: Metric[];
  after: Metric[];
  deltas: Metric[];
  assumptions: string[];
  confidence: "illustrative" | "low" | "medium" | "high";
};
```

Examples:

### Cool the Block
Input:
- canopy-area proxy,
- selected intervention intensity.

Output:
- simulated canopy proxy,
- green-coverage score,
- intervention footprint.

### Reclaim the Lot
Input:
- vacant count in mission radius,
- selected number of parcels.

Output:
- remaining vacant count,
- reuse share,
- simple scenario score.

### Flood Ready
Input:
- mission area intersecting floodplain,
- intervention coverage percentage.

Output:
- “treated area proxy,”
- scenario resilience score.
Do not present as hydraulic engineering.

---

# Map architecture

Base:
- OpenFreeMap style.
- Baltimore center approximately `[-76.6122, 39.2904]`.

Layers:
1. basemap,
2. 3D buildings,
3. Baltimore boundary optional,
4. active data overlay,
5. intervention overlay,
6. mission markers,
7. City Memory markers.

Modes:
- Reality: hide analytic overlays except selected mission.
- Data: show selected civic layer + legend.
- Better: show baseline data lightly + intervention layer strongly.

Fly-to:
- mission click -> zoom 14–16, pitch 55–65.
- city overview -> zoom ~11–12.

---

# Data pipeline

For each ArcGIS layer:
1. use `/query`,
2. `where=1=1`,
3. `outFields=*`,
4. `returnGeometry=true`,
5. `f=geojson`,
6. request `outSR=4326` where supported,
7. paginate if necessary,
8. keep only needed fields,
9. simplify geometry,
10. derive mission hotspot.

Never ship full raw city datasets to the browser when a summarized/simplified dataset will do.

---

# Hotspot derivation

Keep it simple and explainable.

For points:
- grid or geohash/bin,
- count points per bin,
- optionally weight by recency,
- choose highest stable bin.

For polygons:
- intersection/area coverage with a coarse grid,
- choose high-exposure cell.

For canopy:
- compute canopy coverage within candidate cells/neighborhoods.
- low coverage -> higher mission score.

Output:
```json
{
  "missionId": "cool-the-block",
  "lat": 39.0,
  "lng": -76.0,
  "score": 0.82,
  "metrics": [...],
  "method": "low tree-canopy coverage within selected analysis cell"
}
```

---

# Reliability and fallbacks

## Map tiles fail
Show a clear fatal error and reload action. Do not silently show fake geography.

## ArcGIS source temporarily fails
Use cached normalized GeoJSON produced earlier in the hackathon and show retrieval timestamp.

## SpacetimeDB cloud fails
Use local SpacetimeDB for judging/demo.

## Gemini unavailable
Civic Copilot becomes “Evidence Explorer” and returns retrieved source chunks/metrics without an LLM.

## 311 source not verified
Keep Clean Streets/Park Smarter/Safer Streets as labeled scenario missions, not measured claims.

## Marimo package conflict
Use minimal dependencies and static normalized JSON.
The notebook must still be interactive.

---

# Testing

Unit tests:
- each simulation function,
- metric provenance labels,
- bounded outputs,
- mission/intervention mapping.

Integration:
- SpacetimeDB reducer call,
- subscription update,
- data source fetch script,
- map overlay load.

Smoke:
- load home,
- enter map,
- click each mission,
- run each simulation,
- switch all modes,
- open marimo,
- no console exceptions.
