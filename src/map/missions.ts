import { Marker } from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Mission } from "../app/types";

const CATEGORY_COLOR: Record<string, string> = {
  "Tree Canopy": "#2f9e44",
  "Vacant Buildings": "#e8590c",
  "Sanitation (Scenario)": "#868e96",
  Floodplain: "#1971c2",
  "Parking (Scenario)": "#9c36b5",
  "Street Safety (Scenario)": "#e03131",
};

export function markerColor(mission: Mission): string {
  return CATEGORY_COLOR[mission.category] ?? "#495057";
}

export interface MissionMarkerHandle {
  marker: Marker;
  mission: Mission;
}

export function createMissionMarker(
  map: MapLibreMap,
  mission: Mission,
  onClick: (mission: Mission) => void,
  completed: boolean,
): MissionMarkerHandle {
  const el = document.createElement("button");
  el.className = "mission-marker";
  el.style.setProperty("--marker-color", markerColor(mission));
  el.setAttribute("aria-label", mission.title);
  el.dataset.completed = String(completed);
  el.type = "button";

  el.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick(mission);
  });

  const marker = new Marker({ element: el, anchor: "center" })
    .setLngLat([mission.lng, mission.lat])
    .addTo(map);

  return { marker, mission };
}
