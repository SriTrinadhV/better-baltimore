# Better Baltimore — START HERE

## Mission
Build and ship a complete HopHacks submission in **12 hours**. Prioritize a stable, judge-ready vertical slice over breadth. Do not turn this into a learning exercise. Implement first, test continuously, polish, deploy, and prepare the demo.

## Primary competition track
**Best Data Visualization**

HopHacks' Data Visualization track requires:
- Baltimore City open data.
- An interactive data visualization.
- A **marimo notebook**.
- A clear, explorable, impactful civic story.

The project may use SpacetimeDB as its real-time backend, but the official track is Data Visualization. Do not frame SpacetimeDB itself as the reason the project belongs in the Data track.

## Hackathon constraints
- All code must be created during the hackathon.
- Public APIs, libraries, open-source tools, and sponsor tools are allowed.
- AI coding tools are allowed.
- Only one official track may be selected.
- All projects are still considered for the general prize.

## Product in one sentence
**Better Baltimore is an explorable 3D civic-data simulation of Baltimore where real city data identifies real problems, players test interventions, and the app visualizes the difference between Baltimore today and a modeled “Better Baltimore.”**

## Non-negotiable MVP
A submission is not complete until all of these work:

1. **Whole-city 3D Baltimore**
   - Use MapLibre GL JS + OpenFreeMap vector tiles and 3D building extrusions.
   - Baltimore must be pan/zoom/rotate/pitch explorable.
   - Important mission areas use camera fly-to transitions.
   - Do not manually model the city.

2. **Three city views**
   - `REALITY`: normal 3D Baltimore with mission markers.
   - `DATA`: civic-data layers/hotspots visibly encoded on the map.
   - `BETTER`: the same city with the selected simulated intervention visualized.
   - Switching modes must preserve the camera position whenever possible.

3. **Six development missions visible on the map**
   - Cool the Block
   - Reclaim the Lot
   - Clean the Streets
   - Flood Ready
   - Park Smarter
   - Safer Streets
   At least **three missions must be deeply functional and data-backed**. The other three may use simpler interaction as long as they are clearly marked and do not fabricate real-world facts.

4. **Mission flow**
   - Click marker.
   - See why this mission is located there.
   - See source/provenance and relevant metrics.
   - Choose one of 2–4 interventions.
   - Run a deterministic simulation.
   - See before/after metrics.
   - See the 3D map visibly change.
   - Save the player's decision to SpacetimeDB.

5. **SpacetimeDB is the authoritative game backend**
   - Store missions, mission state, interventions, user/session state, simulation results, world changes, and City Memories.
   - Use reducers for mutations.
   - Use subscriptions so updates appear in real time.
   - If cloud deployment blocks progress, demo with local SpacetimeDB; do not replace it with localStorage/Firebase/Supabase.

6. **Marimo Data Command Center**
   - Interactive notebook/app using the same Baltimore data.
   - Must include at minimum:
     - dataset/source selector,
     - neighborhood/area filter,
     - interactive map or geospatial plot,
     - metric charts,
     - mission hotspot explanation,
     - intervention slider/input,
     - before/after output.
   - It does not need live two-way synchronization with the 3D client if that threatens the 12-hour deadline. It must use the same normalized source data and analytical logic.

7. **Source transparency**
   Every real-data mission must show:
   - source name,
   - source URL,
   - data timestamp/refresh date if available,
   - what is measured,
   - what is inferred,
   - what is simulated.

8. **Demo-ready**
   - One polished 90–120 second demo path.
   - No broken buttons.
   - No fake “AI magic.”
   - No unlabeled invented statistics.

## Design principle
Graphics should be **simple but geographically recognizable**. Spend effort on data, state, interaction, simulation, and polish—not detailed 3D art.

## Scope rule
At hour 8, stop adding infrastructure.  
At hour 10, stop adding features.  
Hours 10–12 are only for reliability, deploy/demo, submission, and buffer.

## Implementation order
Read these files in order:
1. `01_PRODUCT_SPEC.md`
2. `02_12_HOUR_EXECUTION_PLAN.md`
3. `03_TECHNICAL_ARCHITECTURE.md`
4. `04_DATA_TRACK_AND_DATASETS.md`
5. `05_AI_ADVANCED_FEATURES.md`
6. `06_CLAUDE_MASTER_PROMPT.md`
7. `07_DEMO_AND_SUBMISSION.md`

Then execute the build plan without waiting for approval after every micro-step.

## Communication style with the user
Do not teach unless asked. After each major phase, report only:
- what is now working,
- test result,
- current blocker if any,
- next phase,
- git commit hash/message.

Ask the user only when a credential/permission is truly required and no safe fallback exists.
