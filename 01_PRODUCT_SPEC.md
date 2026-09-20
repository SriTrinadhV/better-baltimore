# Better Baltimore — Product Specification

## 1. Core idea
Better Baltimore is not primarily a tourism game and not primarily a “news game.”

The main purpose is:
1. Turn Baltimore civic data into something people can explore spatially.
2. Reveal real city problems at real locations.
3. Let users test plausible interventions.
4. Show a visual and quantitative **before vs. simulated-after** comparison.
5. Make civic data understandable to people who would never inspect raw datasets or government dashboards.

Secondary purpose:
- Preserve Baltimore culture through **City Memories**: notable concerts, sports events, festivals, public gatherings, and community moments that can be revisited as lightweight interactive scenes.

## 2. Product framing for judges
Do not pitch:
> “We built a game using city data.”

Pitch:
> “Baltimore publishes rich civic data, but most residents will never explore a CSV or GIS dashboard. Better Baltimore turns that data into a city you can step into. Real datasets identify problems, those problems become missions, users test interventions, and the system visualizes how the same place could look and perform differently.”

## 3. Main experience

### View A — REALITY
A stylized but recognizable 3D Baltimore.
- Whole city is explorable.
- Mission markers appear at data-derived locations.
- Clicking a mission explains why the location matters.

### View B — DATA
The city itself becomes a data visualization.
Examples:
- tree-canopy layer,
- vacant-building hotspots,
- flood-risk polygons,
- 311 issue density,
- parking-pressure proxy,
- street/infrastructure issue density.

Data view is a visualization, not decoration. It must include legends and values.

### View C — BETTER
The same camera/location, but the selected intervention is applied.
Examples:
- added tree-canopy visualization,
- transformed vacant parcel,
- cleanup/311 pressure reduction,
- flood intervention overlay,
- redistributed parking demand,
- street-safety intervention.

All outcome values must be labeled as one of:
- `Observed data`
- `Derived metric`
- `Simulation estimate`

## 4. Six mission system

### Mission 1 — Cool the Block
**Problem:** low tree canopy / heat exposure proxy.

Data:
- Baltimore City Tree Canopy layer.
- Optional supplemental heat data only if a trustworthy source is obtained quickly.

Player can choose:
- plant street trees,
- add shaded public-space nodes,
- create a pocket-park intervention.

Simulation:
- change canopy proxy,
- compute approximate affected area,
- update a normalized “heat/green exposure” score.
Do not claim exact temperature reduction without a defensible model/source.

Visual:
- add green canopy patches/circles/tree markers.
- Data view shows low-canopy areas.

### Mission 2 — Reclaim the Lot
**Problem:** vacant buildings / underused properties.

Data:
- Baltimore Vacant Building Notices.

Player can choose:
- community green space,
- mixed community use,
- housing/reuse concept.

Simulation:
- selected parcels move from “vacant burden” to “intervened.”
- estimate number of affected parcels/nearby points.
- do not claim real economic gains unless sourced.

Visual:
- highlighted vacant points/polygons disappear or change state.
- simple 3D intervention marker/model appears.

### Mission 3 — Clean the Streets
**Problem:** sanitation/illegal-dumping/service-request clusters.

Data:
- Baltimore 311/open service-request feed if available through Open Baltimore/ArcGIS.
- Filter categories such as illegal dumping, trash/recycling, street cleaning.

Player can choose:
- targeted cleanup,
- collection-point placement,
- increased service cadence.

Simulation:
- reduce modeled issue pressure in a radius based on intervention capacity.
- output “modeled unresolved-request pressure,” not false claims of real cleanup.

Visual:
- heat layer or clusters fade in Better view.

### Mission 4 — Flood Ready
**Problem:** areas intersecting Baltimore floodplain / stormwater exposure.

Data:
- Baltimore City Floodplain layer.

Player can choose:
- rain gardens,
- permeable-surface intervention,
- green-infrastructure buffer.

Simulation:
- simple vulnerability/coverage model using affected area.
- no engineering claim that a specific intervention prevents a real flood.

Visual:
- flood-risk polygons + intervention overlay.

### Mission 5 — Park Smarter
**Problem:** parking demand can concentrate near destinations while capacity farther away is underused.

The long-term concept includes:
- predicted availability at ETA,
- legal-at-arrival rules,
- public-camera or occupancy inputs,
- demand redistribution.

12-hour implementation:
- Use authoritative parking/311 parking data if found quickly.
- Otherwise create a clearly labeled **scenario simulation** using real Baltimore geography and a documented demand model.
- The mission should compare:
  - closest/high-pressure option,
  - slightly farther/lower-pressure option,
  - walking tradeoff.

Never claim real-time occupancy unless an authoritative live source actually provides it.

### Mission 6 — Safer Streets
**Problem:** recurring street/infrastructure complaints or unsafe conditions.

Data:
- Prefer Baltimore 311 road/pothole/streetlight/signal categories or an official crash/safety source if quickly verified.

Player can choose:
- crosswalk/lighting improvement,
- traffic-calming intervention,
- repair-priority intervention.

Simulation:
- change a risk/issue score only.
- do not claim crash reduction without a defensible model.

## 5. Mission placement rule
Mission coordinates should not be arbitrary if the required dataset supports geospatial analysis.

Pipeline:
1. Fetch city data.
2. Normalize to WGS84.
3. Aggregate to grid/neighborhood/radius.
4. Compute problem score.
5. Pick top hotspot candidate(s).
6. Mission marker is spawned there.
7. Source and scoring method are shown to the user.

For the demo, use one stable hotspot per deep mission so the experience is repeatable.

## 6. “Why here?” panel
Every deep mission needs this panel:

- Mission name.
- Area/neighborhood.
- 2–4 observed metrics.
- “Why this location?” one-sentence explanation.
- Source badges.
- Method badge:
  - observed,
  - derived,
  - simulated.

This is essential for Data-track credibility.

## 7. Intervention model
The simulation must be deterministic and inspectable.

Use a generic model:
- `baseline_metrics`
- `intervention`
- `parameters`
- `computed_delta`
- `after_metrics`
- `assumptions`

LLMs never calculate the authoritative result.

## 8. City Memories
Secondary feature only.

A City Memory is:
- title,
- category,
- place,
- date,
- short factual description,
- source,
- optional “relive” camera sequence.

For the hackathon:
- implement 1–2 memories maximum.
- a “relive” experience may be a camera fly-to + scene state + event overlay + short narrative.
- do not recreate copyrighted performances.
- prioritize public/city/community experiences.

## 9. Multiplayer/shared-world concept
SpacetimeDB allows multiple clients to see:
- mission completion,
- interventions,
- collective “Better Baltimore” state,
- optional connected-user count.

A strong demo:
- open two browser windows,
- complete an intervention in one,
- show the other update through a SpacetimeDB subscription.

## 10. City impact score
Optional but useful:
- Green resilience
- Housing reuse
- Cleanliness
- Flood readiness
- Mobility
- Street safety

These are **game/simulation indices**, not claims about Baltimore's actual quality of life.
Label them “Scenario score.”

## 11. UX
Landing screen:
- Better Baltimore
- short one-line pitch
- `Explore Baltimore`
- `Open Data Command Center`

Main 3D screen:
- top mode switch: `Reality | Data | Better`
- left mission list/filter
- map/3D city center
- right mission/source panel
- bottom small legend/status
- optional “Civic Copilot” button

Mission modal/panel:
1. Problem.
2. Evidence.
3. Intervention choices.
4. Simulate.
5. Before/after.
6. Save.

## 12. Visual style
- clean civic-tech interface,
- dark/neutral base map or clean light map,
- low-complexity 3D buildings,
- limited, consistent data colors,
- clear legends,
- smooth fly-to transitions,
- no excessive game HUD.

## 13. What NOT to build in 12 hours
- manually modeled Baltimore,
- full character controller,
- realistic pedestrians/vehicles,
- full economic simulation,
- actual city planning optimizer,
- complex carbon model,
- robust social network,
- more than two City Memories,
- custom auth,
- payments,
- real-time camera computer vision,
- production-grade RAG vector infrastructure.

Those belong in the roadmap, not the MVP.
