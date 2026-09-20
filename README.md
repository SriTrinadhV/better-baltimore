# Better Baltimore

An explorable 3D civic-data simulation of Baltimore: real open-data hotspots become missions, players test interventions, and the app visualizes the difference between Baltimore today (`REALITY`), the underlying civic data (`DATA`), and a modeled `BETTER` scenario.

Built for HopHacks — **Best Data Visualization** track.

Full product/technical spec lives in the numbered context-pack docs at the repo root (`00_START_HERE_CLAUDE.md` through `08_REFERENCE_LINKS.md`).

## Stack

- React + TypeScript + Vite
- MapLibre GL JS + OpenFreeMap vector tiles (3D buildings)
- SpacetimeDB (authoritative backend, added in Phase 2)
- marimo + Python (Data Command Center, added in Phase 5)

## Quickstart (full stack, from a cold machine)

```bash
# 1. Frontend
npm install
npm run dev                     # http://localhost:5173

# 2. Backend (separate terminal) — see "SpacetimeDB" below for first-time setup
spacetime start &                # local server, http://127.0.0.1:3000
# (already published once? skip straight to `npm run dev` above — the app
#  auto-seeds the mission table on first connect if it's empty)

# 3. Data Command Center (optional, separate terminal)
python3 -m venv .venv && source .venv/bin/activate
pip install -r analysis/requirements.txt
marimo run analysis/better_baltimore.py
```

Open http://localhost:5173, click **Explore Baltimore**. The "SpacetimeDB connected" badge in the header confirms the backend is reachable.

## Run locally (frontend only)

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
├─ app/              # shared types
├─ components/       # React UI components
├─ map/              # MapLibre layer/camera/marker helpers
├─ simulation/       # deterministic scenario engine + tests
├─ ai/               # Civic Copilot corpus/retrieval/generation
├─ spacetime/        # connection + generated client bindings
└─ data/             # SpacetimeDB-backed data hook, seed data, provenance
public/data/         # normalized static datasets + hotspot GeoJSON overlays
spacetimedb/         # SpacetimeDB TypeScript module (schema + reducers)
analysis/            # marimo Data Command Center notebook
scripts/             # Baltimore open-data ingestion pipeline
docs/                # data source documentation
```

## Data transparency

Every mission metric is labeled `observed`, `derived`, or `simulated`. Missions not yet backed by a verified real-time dataset are labeled as scenario simulations rather than presented as measured facts.
