import type { Map as MapLibreMap } from "maplibre-gl";
import { BALTIMORE_CENTER, BALTIMORE_OVERVIEW_ZOOM } from "./layers";

export function flyToMission(map: MapLibreMap, lat: number, lng: number): void {
  map.flyTo({
    center: [lng, lat],
    zoom: 15.5,
    pitch: 60,
    bearing: -15,
    speed: 1.1,
    curve: 1.3,
    essential: true,
  });
}

export function flyToOverview(map: MapLibreMap): void {
  map.flyTo({
    center: BALTIMORE_CENTER,
    zoom: BALTIMORE_OVERVIEW_ZOOM,
    pitch: 45,
    bearing: 0,
    speed: 1.1,
    essential: true,
  });
}
