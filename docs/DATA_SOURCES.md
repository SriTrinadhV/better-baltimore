# Data Sources

Verified against Baltimore City's public ArcGIS REST services on 2026-09-20
by `scripts/derive_hotspots.py`. All three endpoints below were confirmed
live and returning the expected layer (name/geometry type checked) before
this pipeline was built.

## Tree Canopy
- URL: https://geodata.baltimorecity.gov/egis/rest/services/Housing/dmxBoundaries/MapServer/27
- Layer name (as returned by the service): "Tree Canopy"
- Geometry: polygon
- Used for: Cool the Block mission hotspot + Data-view canopy overlay.

## Vacant Building Notices
- URL: https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/1
- Layer name (as returned by the service): "Vacant Building Notice - Open"
- Geometry: point
- Used for: Reclaim the Lot mission hotspot + Data-view vacancy overlay.

## Floodplain
- URL: https://egis.baltimorecity.gov/egis/rest/services/Housing/dmxCityPrograms/MapServer/25
- Layer name (as returned by the service): "Floodplain"
- Geometry: polygon
- Used for: Flood Ready mission hotspot + Data-view floodplain overlay.

## Method
A 6x6 grid was laid over the Baltimore city bounding box.
For each cell, each layer was queried with an intersecting-envelope spatial
filter (`spatialRel=esriSpatialRelIntersects`), not a full citywide dump.
Canopy/floodplain scores are the fraction of each cell's area covered by
intersecting polygons; vacancy score is the count of intersecting points.
The mission hotspot is the cell that ranks highest for that mission's
problem (lowest canopy, highest vacancy count, highest floodplain overlap),
excluding cells with no urban signal at all (open water, etc.) for the
canopy mission.

This is a transparent, reproducible derivation — not a claim of official
city planning designation. Re-run `python3 scripts/derive_hotspots.py` to
refresh with current data (requires the `requests` and `shapely` packages).
