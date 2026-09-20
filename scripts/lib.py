"""Shared helpers for Baltimore open-data ingestion scripts.

Queries Baltimore City's public ArcGIS REST layers directly (no API key
required) with a small envelope per grid cell, rather than downloading full
citywide datasets — see docs/DATA_SOURCES.md for the exact URLs used.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import requests

REQUEST_TIMEOUT = 20
RETRIES = 2


@dataclass(frozen=True)
class Cell:
    """A grid cell: a small lat/lng bounding box used as an ArcGIS query envelope."""

    row: int
    col: int
    xmin: float
    ymin: float
    xmax: float
    ymax: float

    @property
    def center(self) -> tuple[float, float]:
        """Returns (lat, lng)."""
        return ((self.ymin + self.ymax) / 2, (self.xmin + self.xmax) / 2)

    @property
    def area_deg2(self) -> float:
        return (self.xmax - self.xmin) * (self.ymax - self.ymin)

    def as_polygon_coords(self) -> list[list[float]]:
        return [
            [self.xmin, self.ymin],
            [self.xmax, self.ymin],
            [self.xmax, self.ymax],
            [self.xmin, self.ymax],
            [self.xmin, self.ymin],
        ]


# Baltimore city limits, approximately.
BALTIMORE_BBOX = {"xmin": -76.712, "ymin": 39.197, "xmax": -76.529, "ymax": 39.372}


def build_grid(rows: int, cols: int, bbox: dict[str, float] = BALTIMORE_BBOX) -> list[Cell]:
    dx = (bbox["xmax"] - bbox["xmin"]) / cols
    dy = (bbox["ymax"] - bbox["ymin"]) / rows
    cells = []
    for r in range(rows):
        for c in range(cols):
            xmin = bbox["xmin"] + c * dx
            xmax = xmin + dx
            ymin = bbox["ymin"] + r * dy
            ymax = ymin + dy
            cells.append(Cell(r, c, xmin, ymin, xmax, ymax))
    return cells


def query_count(base_url: str, cell: Cell) -> int:
    """Exact feature count intersecting a cell, uncapped by maxRecordCount
    (ArcGIS honors returnCountOnly regardless of the layer's page-size cap).
    """
    params = {
        "where": "1=1",
        "geometry": f"{cell.xmin},{cell.ymin},{cell.xmax},{cell.ymax}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "returnCountOnly": "true",
        "f": "json",
    }
    last_err: Exception | None = None
    for attempt in range(RETRIES + 1):
        try:
            resp = requests.get(f"{base_url}/query", params=params, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            return int(resp.json()["count"])
        except Exception as err:  # noqa: BLE001 - retry loop, re-raised below
            last_err = err
            time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"Failed to count {base_url}: {last_err}")


def query_envelope(base_url: str, cell: Cell, extra_params: dict | None = None) -> dict:
    """Query an ArcGIS FeatureServer/MapServer layer's /query endpoint for
    features intersecting a cell's bounding box, returned as GeoJSON in WGS84.
    """
    params = {
        "where": "1=1",
        "geometry": f"{cell.xmin},{cell.ymin},{cell.xmax},{cell.ymax}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "*",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "geojson",
    }
    if extra_params:
        params.update(extra_params)

    last_err: Exception | None = None
    for attempt in range(RETRIES + 1):
        try:
            resp = requests.get(f"{base_url}/query", params=params, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except Exception as err:  # noqa: BLE001 - retry loop, re-raised below
            last_err = err
            time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"Failed to query {base_url}: {last_err}")
