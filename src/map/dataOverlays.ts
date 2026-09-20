import type { Map as MapLibreMap } from "maplibre-gl";

interface OverlayLayerSpec {
  id: string;
  sourceId: string;
  url: string;
  color: string;
  kind: "fill" | "circle";
}

const OVERLAYS: OverlayLayerSpec[] = [
  {
    id: "overlay-tree-canopy",
    sourceId: "src-tree-canopy",
    url: "/data/tree_canopy_hotspot.geojson",
    color: "#2f9e44",
    kind: "fill",
  },
  {
    id: "overlay-vacant",
    sourceId: "src-vacant",
    url: "/data/vacant_hotspot.geojson",
    color: "#e8590c",
    kind: "circle",
  },
  {
    id: "overlay-floodplain",
    sourceId: "src-floodplain",
    url: "/data/floodplain_hotspot.geojson",
    color: "#1971c2",
    kind: "fill",
  },
];

/** Adds the three real-data hotspot overlay layers (hidden by default). Idempotent per map instance. */
export function ensureDataOverlays(map: MapLibreMap): void {
  for (const spec of OVERLAYS) {
    if (map.getSource(spec.sourceId)) continue;
    map.addSource(spec.sourceId, { type: "geojson", data: spec.url });

    if (spec.kind === "fill") {
      map.addLayer({
        id: spec.id,
        type: "fill",
        source: spec.sourceId,
        layout: { visibility: "none" },
        paint: { "fill-color": spec.color, "fill-opacity": 0.45 },
      });
    } else {
      map.addLayer({
        id: spec.id,
        type: "circle",
        source: spec.sourceId,
        layout: { visibility: "none" },
        paint: {
          "circle-color": spec.color,
          "circle-radius": 4,
          "circle-opacity": 0.85,
        },
      });
    }
  }
}

/** Shows only the overlays relevant to DATA/BETTER mode; hides all in REALITY. */
export function setDataOverlaysVisible(map: MapLibreMap, visible: boolean): void {
  for (const spec of OVERLAYS) {
    if (!map.getLayer(spec.id)) continue;
    map.setLayoutProperty(spec.id, "visibility", visible ? "visible" : "none");
  }
}
