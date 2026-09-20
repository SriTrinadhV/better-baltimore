import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection, Point } from "geojson";

export const OVERLAY_SOURCE_ID = "better-baltimore-overlay";
const CIRCLE_LAYER_ID = "better-baltimore-overlay-circles";

export interface OverlayFeatureProps {
  missionId: string;
  intensity: number; // 0-1, drives radius/opacity
  color: string;
  label: string;
}

export function ensureOverlaySource(map: MapLibreMap): void {
  if (map.getSource(OVERLAY_SOURCE_ID)) return;

  map.addSource(OVERLAY_SOURCE_ID, {
    type: "geojson",
    data: emptyCollection(),
  });

  map.addLayer({
    id: CIRCLE_LAYER_ID,
    type: "circle",
    source: OVERLAY_SOURCE_ID,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "intensity"], 0, 10, 1, 60],
      "circle-color": ["get", "color"],
      "circle-opacity": 0.35,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.8,
    },
  });
}

export function setOverlayFeatures(
  map: MapLibreMap,
  points: Array<{ lat: number; lng: number; props: OverlayFeatureProps }>,
): void {
  const source = map.getSource(OVERLAY_SOURCE_ID) as GeoJSONSource | undefined;
  if (!source) return;

  const features: Feature<Point, OverlayFeatureProps>[] = points.map(({ lat, lng, props }) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: props,
  }));

  source.setData({ type: "FeatureCollection", features } as FeatureCollection<Point, OverlayFeatureProps>);
}

function emptyCollection(): FeatureCollection<Point, OverlayFeatureProps> {
  return { type: "FeatureCollection", features: [] };
}
