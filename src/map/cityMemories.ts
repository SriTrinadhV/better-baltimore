import { Marker } from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { CityMemory } from "../app/types";

export interface CityMemoryMarkerHandle {
  marker: Marker;
  memory: CityMemory;
}

export function createCityMemoryMarker(
  map: MapLibreMap,
  memory: CityMemory,
  onClick: (memory: CityMemory) => void,
): CityMemoryMarkerHandle {
  const el = document.createElement("button");
  el.className = "city-memory-marker";
  el.setAttribute("aria-label", memory.title);
  el.type = "button";
  el.textContent = "★"; // ★

  el.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick(memory);
  });

  const marker = new Marker({ element: el, anchor: "center" }).setLngLat([memory.lng, memory.lat]).addTo(map);

  return { marker, memory };
}
