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

## SpacetimeDB CLI

An ARM64 Linux build of the SpacetimeDB CLI is available and works natively on this Jetson (no cloud dependency required for local dev). Install it to `~/.local/bin/spacetime` and ensure `~/.local/bin` is on `PATH`.

## Marimo Data Command Center (Phase 5+)

```bash
marimo run analysis/better_baltimore.py
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
