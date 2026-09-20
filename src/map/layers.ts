import type { Map as MapLibreMap, LayerSpecification } from "maplibre-gl";

const BUILDINGS_LAYER_ID = "better-baltimore-3d-buildings";

/**
 * OpenFreeMap's "liberty" style is built on the OpenMapTiles schema:
 * source "openmaptiles", source-layer "building", with render_height /
 * render_min_height properties. Skipped silently if the style's source
 * layout ever changes, so a style swap degrades to 2D rather than crashing.
 */
export function add3dBuildings(map: MapLibreMap): void {
  if (map.getLayer(BUILDINGS_LAYER_ID)) return;
  const style = map.getStyle();
  const hasSource = Boolean(style?.sources?.["openmaptiles"]);
  if (!hasSource) return;

  const firstSymbolLayer = style?.layers?.find((l: LayerSpecification) => l.type === "symbol")?.id;

  map.addLayer(
    {
      id: BUILDINGS_LAYER_ID,
      source: "openmaptiles",
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 13,
      paint: {
        "fill-extrusion-color": "#b9c2cc",
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.85,
      },
    },
    firstSymbolLayer,
  );
}

export const BALTIMORE_CENTER: [number, number] = [-76.6122, 39.2904];
export const BALTIMORE_OVERVIEW_ZOOM = 11.5;
