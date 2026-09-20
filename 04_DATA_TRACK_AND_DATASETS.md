# Better Baltimore — Data Track Strategy & Data Sources

## Track strategy
The project must feel like a **data story with a 3D interface**, not a game with data pasted on top.

The competition's Data Visualization brief requires:
- open data from Baltimore City,
- an interactive visualization,
- marimo,
- a complete story that is clear, explorable, and impactful.

Therefore the central narrative is:

```text
Baltimore open data
    ↓
problem discovery
    ↓
spatial hotspot
    ↓
3D data visualization
    ↓
player intervention
    ↓
transparent simulation
    ↓
before/after comparison
```

## What makes the project Data-track credible
Every deep mission needs four layers:

### 1. Source
Where did the city information come from?

### 2. Observation
What does the dataset directly measure?

### 3. Derivation
What metric did we compute from it?

### 4. Simulation
What is our hypothetical intervention changing?

Never blur these together.

---

# Official / authoritative starting sources

## Open Baltimore catalog/search API
Use this to discover and validate Baltimore City datasets.

Base:
`https://data.baltimorecity.gov/`

Search API documentation:
`https://data.baltimorecity.gov/api/search/definition/`

Use this as the first place to verify a dataset before presenting it as “Baltimore City open data.”

---

## Tree Canopy
Baltimore City GIS layer:
`https://geodata.baltimorecity.gov/egis/rest/services/Housing/dmxBoundaries/MapServer/27`

Properties:
- polygon geometry,
- supports GeoJSON queries,
- official Baltimore City GIS domain.

Use for:
- Cool the Block,
- canopy Data view,
- location selection.

Query pattern:
`.../27/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson`

---

## Vacant Building Notices
Baltimore City/ArcGIS source identified in official dataset metadata:
`https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/1`

Additional city GIS layer:
`https://geodata.baltimorecity.gov/egis/rest/services/Housing/BuildingBlocks_Slate/MapServer/36`

The dataset is described as Baltimore vacant-building notices and is updated frequently/daily in its metadata.

Use for:
- Reclaim the Lot,
- vacancy hotspot layer,
- neighborhood counts.

Fields may include:
- notice number,
- date,
- neighborhood,
- address,
- council district,
- geometry.

---

## Floodplain
Baltimore City GIS:
`https://egis.baltimorecity.gov/egis/rest/services/Housing/dmxCityPrograms/MapServer/25`

Alternative planning service:
`https://geodata.baltimorecity.gov/egis/rest/services/Planning/Boundaries/MapServer`

Use for:
- Flood Ready,
- flood-risk polygons,
- intersection-based scenario.

Important:
The floodplain is observed/official geographic data.
The effect of the player's intervention is a **simulation**, not an official engineering forecast.

---

## 311 / service requests
Open Baltimore contains Baltimore 311/service-request data. The current service may be hosted through ArcGIS and may use year-specific services.

During the hackathon:
1. verify the current source using Open Baltimore search/catalog,
2. inspect fields,
3. save the exact source URL in `docs/DATA_SOURCES.md`,
4. cache a limited sample or summarized output.

Potential mission categories:
- illegal dumping,
- trash/recycling,
- street cleaning,
- parking,
- potholes/roads,
- street lights/signals,
- water/sewer/drainage.

Do not hard-code an unverified current service endpoint into the final explanation.

---

# Basemap / 3D source
The 3D basemap is not the civic dataset used to qualify for the Data track.

Recommended:
- MapLibre GL JS
- OpenFreeMap vector tiles

OpenFreeMap style:
`https://tiles.openfreemap.org/styles/liberty`

MapLibre supports 3D building fill extrusions from OpenFreeMap's building layer.

This is the rendering foundation; Baltimore City open data is layered on top for the analysis.

---

# Dataset priority for the 12-hour build

## Tier A — must ship
1. Tree Canopy
2. Vacant Building Notices
3. Floodplain

Why:
- all are clearly geospatial,
- all support strong 3D overlays,
- each maps cleanly to a mission,
- each supports a clear before/after story.

## Tier B — add after Tier A works
4. 311 current/recent requests

Use one source to support multiple lighter missions by filtering categories.

## Tier C — do not block submission
- live parking occupancy,
- transit feeds,
- heat raster,
- crash data,
- real-time news/events.

These can become roadmap items if they cannot be verified and integrated quickly.

---

# Marimo Data Command Center

Required experience:

## Header
- Better Baltimore — Data Command Center
- short explanation of the current data story.

## Controls
- dataset selector,
- mission selector,
- area/neighborhood selector if practical,
- intervention intensity slider,
- optional time filter for 311.

## Visuals
At least:
1. interactive geospatial view,
2. one ranked/summary chart,
3. before/after intervention chart,
4. source/provenance table.

## Suggested story tabs/sections
- `Where is the problem?`
- `What does the data show?`
- `What if we intervene?`
- `What are the assumptions?`

## Shared logic
The notebook and game should import/use the same normalized mission JSON where practical.
Avoid maintaining two unrelated analyses.

---

# Data-story examples

## Cool the Block
Observed:
- tree-canopy geometry/coverage.

Derived:
- low-canopy hotspot score.

Simulated:
- intervention canopy added to the scenario.

Judge sentence:
> “The location was selected from the canopy dataset; the proposed improvement is a transparent scenario, not a claim about an approved city plan.”

## Reclaim the Lot
Observed:
- vacant building notices.

Derived:
- vacancy density around the mission area.

Simulated:
- a selected subset is marked as reused.

Judge sentence:
> “The vacancy count is data-backed; the reuse choice is the player's hypothetical intervention.”

## Flood Ready
Observed:
- official floodplain geometry.

Derived:
- overlap with a mission area.

Simulated:
- green-infrastructure treatment coverage and scenario score.

Judge sentence:
> “We visualize the official floodplain, then separately visualize a hypothetical intervention.”

---

# Data-view design
The 3D map should have a legend and dataset selector.

Examples:
- Tree canopy: green polygon/coverage layer.
- Vacancy: point/cluster layer.
- Floodplain: translucent polygons.
- 311: heatmap/cluster layer.

Clicking a feature/hotspot should reveal:
- value/count,
- source,
- method,
- mission connection.

---

# Source provenance format
Create `public/data/sources.json`:

```json
[
  {
    "id": "tree-canopy",
    "name": "Baltimore City Tree Canopy",
    "publisher": "Baltimore City",
    "url": "...",
    "retrievedAt": "...",
    "observed": "Tree-canopy polygons",
    "derived": "Local canopy/hotspot metrics",
    "simulated": "Canopy added by player intervention"
  }
]
```

The UI must use this metadata instead of hard-coded vague text.

---

# Judge-facing distinction
Use these labels everywhere:

- **Observed** = comes directly from the dataset.
- **Derived** = our calculation from observed data.
- **Simulated** = hypothetical outcome from a player choice.

This makes the project more trustworthy and more technically defensible.
