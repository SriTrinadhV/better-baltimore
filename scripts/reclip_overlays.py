"""One-off fix: the polygon overlay files (tree canopy, floodplain) were
written with each intersecting feature's FULL geometry, not clipped to the
grid cell — some floodplain polygons span a huge area, producing a 14MB
file. This re-fetches just the two winning polygon cells and writes
properly clipped + simplified geometry. Vacant (point) overlay is untouched.

Run: python3 scripts/reclip_overlays.py
"""

from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import box, mapping, shape

from derive_hotspots import FLOODPLAIN_URL, PUBLIC_DATA, TREE_CANOPY_URL
from lib import build_grid, query_envelope

SIMPLIFY_TOLERANCE_DEG = 0.00005  # ~5m at this latitude


def clipped_geojson(base_url: str, row: int, col: int) -> dict:
    cell = next(c for c in build_grid(6, 6) if c.row == row and c.col == col)
    cell_box = box(cell.xmin, cell.ymin, cell.xmax, cell.ymax)
    raw = query_envelope(base_url, cell)

    features = []
    for f in raw.get("features", []):
        geom = f.get("geometry")
        if not geom:
            continue
        try:
            poly = shape(geom)
            if not poly.is_valid:
                poly = poly.buffer(0)
            clipped = cell_box.intersection(poly)
            if clipped.is_empty:
                continue
            simplified = clipped.simplify(SIMPLIFY_TOLERANCE_DEG, preserve_topology=True)
            features.append({"type": "Feature", "geometry": mapping(simplified), "properties": {}})
        except Exception:
            continue

    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    hotspots = json.loads((PUBLIC_DATA / "hotspots.json").read_text())

    canopy_cell = hotspots["cool-the-block"]["gridCell"]
    canopy_geojson = clipped_geojson(TREE_CANOPY_URL, canopy_cell["row"], canopy_cell["col"])
    (PUBLIC_DATA / "tree_canopy_hotspot.geojson").write_text(json.dumps(canopy_geojson))
    print(f"tree_canopy_hotspot.geojson: {len(canopy_geojson['features'])} features")

    flood_cell = hotspots["flood-ready"]["gridCell"]
    flood_geojson = clipped_geojson(FLOODPLAIN_URL, flood_cell["row"], flood_cell["col"])
    (PUBLIC_DATA / "floodplain_hotspot.geojson").write_text(json.dumps(flood_geojson))
    print(f"floodplain_hotspot.geojson: {len(flood_geojson['features'])} features")


if __name__ == "__main__":
    main()
