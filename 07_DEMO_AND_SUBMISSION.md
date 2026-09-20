# Better Baltimore — Judge Demo & Submission

## 90–120 second judge demo

### 0–10 sec — Problem
Show 3D Baltimore overview.

Say:
> Baltimore publishes large amounts of civic data, but most people never interact with it. Better Baltimore turns that data into a city you can explore.

### 10–25 sec — Data is the world
Switch `Reality -> Data`.

Show:
- tree-canopy overlay,
- vacancy/flood layer selector,
- mission markers.

Say:
> The mission locations come from the data rather than being placed arbitrarily. We separate observed city data, our derived metrics, and simulated outcomes.

### 25–55 sec — Main mission
Open **Cool the Block**.

Show:
- Why here?
- source/provenance,
- baseline metric,
- intervention choices.

Choose an intervention.
Run simulation.
Switch `Data -> Better`.

Say:
> This location was selected from Baltimore's tree-canopy data. The player tests an intervention, and our deterministic scenario model creates a hypothetical Better-Baltimore state.

### 55–70 sec — Before/after
Toggle `Reality <-> Better`.

Keep camera fixed.

Show:
- visual intervention,
- before/after metrics,
- “simulation estimate” label.

This should be the strongest visual moment.

### 70–85 sec — Backend
Open second browser tab if stable.

Change a mission in tab A.
Show tab B update.

Say:
> SpacetimeDB is our authoritative world-state backend, so scenario changes are synchronized in real time.

### 85–105 sec — Marimo
Open Data Command Center.

Change:
- dataset,
- mission,
- intervention slider.

Show chart/map react.

Say:
> The same normalized Baltimore data is explorable directly through our marimo Data Command Center, so the 3D story is traceable back to the underlying evidence.

### 105–120 sec — End
Optional:
- show Civic Copilot answer,
- show one City Memory marker.

Finish:
> Better Baltimore asks a simple question: what if civic data were something you could step into, understand, and use to explore possible improvements?

---

# What judges should understand
1. This is a Data Visualization project.
2. Real Baltimore data decides where core missions exist.
3. The 3D city is a visualization interface.
4. Simulation is explicitly separated from fact.
5. SpacetimeDB powers shared scenario state.
6. marimo exposes the analytical layer.
7. AI explains evidence; it does not fabricate outcomes.

---

# Submission description starter

## Inspiration
Baltimore has rich public datasets about the physical and civic condition of the city, but understanding those datasets often requires navigating GIS tools, tables, and separate dashboards. We wanted to make the data spatial, intuitive, and interactive.

## What it does
Better Baltimore turns Baltimore into an explorable 3D civic-data experience. Data-backed mission markers identify city challenges such as low tree canopy, vacant buildings, and flood exposure. Players inspect the evidence, test hypothetical interventions, and compare Baltimore's current state with a simulated “Better” state.

## How we built it
- MapLibre GL JS + OpenFreeMap for whole-city 3D rendering.
- Baltimore City open GIS data for civic layers and mission hotspots.
- SpacetimeDB for authoritative mission/world state and real-time subscriptions.
- marimo for the interactive Data Command Center.
- deterministic scenario models for before/after comparisons.
- optional retrieval-augmented Civic Copilot for evidence explanations.

## Important transparency
Observed data, derived metrics, and simulated outcomes are labeled separately. Better Baltimore does not claim that a scenario is an official city forecast or engineering plan.

---

# Screenshot checklist
Capture:
1. Baltimore 3D overview.
2. Data view with legend.
3. Mission evidence panel.
4. Reality vs Better result.
5. marimo dashboard.
6. SpacetimeDB multi-tab state if visually useful.
7. City Memory if implemented.

---

# Last-hour technical checklist
- `npm run build` passes.
- no TypeScript errors.
- no uncaught console errors.
- all six mission markers open.
- at least three missions use real source metadata.
- source URLs are clickable/copyable.
- SpacetimeDB connects.
- reducer mutation succeeds.
- subscription update succeeds.
- marimo runs.
- mobile/narrow screen is not broken.
- no invented statistic is labeled as observed.
- all environment variables documented.
- `.env` secrets are not committed.
- README contains local run commands.
- repo is pushed.
- Devpost has demo/repo links.

---

# Demo failure fallbacks

## Internet is weak
Use cached normalized data and local SpacetimeDB.

## Hosted backend is unavailable
Run local SpacetimeDB and two local browser tabs.

## marimo hosting is unavailable
Run `marimo run analysis/better_baltimore.py` locally.

## Gemini fails
Hide/disable generation and show Evidence Explorer retrieval cards.

## a live data endpoint fails
Use the cached dataset with retrieval timestamp visible.

A stable cached demonstration is better than a broken “live” demo.
