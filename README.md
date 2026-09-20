# Better Baltimore

An explorable 3D civic-data simulation of Baltimore: real open-data hotspots become missions, players test interventions, and the app visualizes the difference between Baltimore today (`REALITY`), the underlying civic data (`DATA`), and a modeled `BETTER` scenario.

Built for HopHacks — **Best Data Visualization** track.

Full product/technical spec lives in the numbered context-pack docs at the repo root (`00_START_HERE_CLAUDE.md` through `08_REFERENCE_LINKS.md`).

## Stack

- React + TypeScript + Vite
- MapLibre GL JS + OpenFreeMap vector tiles (3D buildings)
- SpacetimeDB (authoritative backend, added in Phase 2)
- marimo + Python (Data Command Center, added in Phase 5)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Test / build

```bash
npm run test      # vitest unit tests (simulation engine)
npx tsc -b         # typecheck
npm run build      # production build
```

## SpacetimeDB

An ARM64 Linux build of the SpacetimeDB CLI is available and works natively on this Jetson (no cloud dependency required for local dev). Installed at `~/.local/bin/spacetime`.

```bash
spacetime start                                    # run the local server (once, in background)
spacetime publish better-baltimore --server local -y --project-path spacetimedb
spacetime generate --lang typescript --out-dir ./src/spacetime/module_bindings --module-path ./spacetimedb
```

The module (`spacetimedb/src/index.ts`) defines the schema and reducers. The frontend connects via `src/spacetime/connection.ts` and mirrors table state into React through `src/data/client.ts`'s `useSpacetimeData()` hook. On first connect, if the `mission` table is empty, the client seeds it from `src/data/missions.seed.ts` and `public/data/sources.json` by calling the `seed_*` reducers.

Set `VITE_SPACETIMEDB_URI` / `VITE_SPACETIMEDB_MODULE` in `.env` to point at a different server (see `.env.example`); defaults to `ws://localhost:3000` / `better-baltimore`.

## Marimo Data Command Center

Runs in an isolated venv (this machine's system pandas/numpy have an ABI conflict — see `STATUS.md`):

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r analysis/requirements.txt
marimo run analysis/better_baltimore.py
```

## Data ingestion

`scripts/derive_hotspots.py` queries Baltimore City's live ArcGIS layers (Tree Canopy, Vacant Building Notices, Floodplain) across a grid over the city, and writes `public/data/hotspots.json`, `src/data/hotspots.generated.json` (consumed by `src/data/missions.seed.ts`), the three `public/data/*_hotspot.geojson` overlay files, and `docs/DATA_SOURCES.md`.

```bash
source .venv/bin/activate  # or your own venv with scripts/requirements.txt installed
python3 scripts/derive_hotspots.py
```

## Project layout

See `03_TECHNICAL_ARCHITECTURE.md` for the full intended layout. Current state:

```
src/
├─ app/            # shared types
├─ components/      # React UI components
├─ map/             # MapLibre layer/camera/marker helpers
├─ simulation/       # deterministic scenario engine + tests
└─ data/            # seed missions, data-source provenance loader
public/data/         # normalized static datasets (sources.json, later hotspot GeoJSON)
spacetimedb/         # SpacetimeDB module (Phase 2)
analysis/            # marimo notebook (Phase 5)
scripts/             # data ingestion scripts (Phase 3)
docs/                # data source documentation
```

## Data transparency

Every mission metric is labeled `observed`, `derived`, or `simulated`. Missions not yet backed by a verified real-time dataset are labeled as scenario simulations rather than presented as measured facts.
