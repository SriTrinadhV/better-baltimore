import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CityMemory, Mission, SimulationResult, ViewMode } from "../app/types";
import { add3dBuildings, BALTIMORE_CENTER, BALTIMORE_OVERVIEW_ZOOM } from "../map/layers";
import { flyToMission, flyToOverview } from "../map/camera";
import { createMissionMarker, markerColor, type MissionMarkerHandle } from "../map/missions";
import { createCityMemoryMarker, type CityMemoryMarkerHandle } from "../map/cityMemories";
import { ensureOverlaySource, setOverlayFeatures } from "../map/betterView";
import { ensureDataOverlays, setDataOverlaysVisible } from "../map/dataOverlays";

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

interface Props {
  missions: Mission[];
  cityMemories: CityMemory[];
  mode: ViewMode;
  selectedMissionId: string | null;
  selectedCityMemoryId: string | null;
  simulationResults: Record<string, SimulationResult>;
  onSelectMission: (mission: Mission) => void;
  onSelectCityMemory: (memory: CityMemory) => void;
}

export function CityMap({
  missions,
  cityMemories,
  mode,
  selectedMissionId,
  selectedCityMemoryId,
  simulationResults,
  onSelectMission,
  onSelectCityMemory,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, MissionMarkerHandle>>(new Map());
  const memoryMarkersRef = useRef<Map<string, CityMemoryMarkerHandle>>(new Map());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Init map once.
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: BALTIMORE_CENTER,
      zoom: BALTIMORE_OVERVIEW_ZOOM,
      pitch: 45,
      bearing: 0,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      add3dBuildings(map);
      ensureOverlaySource(map);
      ensureDataOverlays(map);
      setStatus("ready");
    });

    map.on("error", (e) => {
      console.error("MapLibre error", e.error ?? e);
      setStatus((prev) => (prev === "loading" ? "error" : prev));
    });

    return () => {
      markersRef.current.forEach((h) => h.marker.remove());
      markersRef.current.clear();
      memoryMarkersRef.current.forEach((h) => h.marker.remove());
      memoryMarkersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create/update markers when missions or selection/status change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    for (const mission of missions) {
      const existing = markersRef.current.get(mission.id);
      const completed = mission.status === "completed";
      if (!existing) {
        const handle = createMissionMarker(map, mission, onSelectMission, completed);
        markersRef.current.set(mission.id, handle);
      } else {
        existing.marker.getElement().dataset.completed = String(completed);
      }
      const el = markersRef.current.get(mission.id)!.marker.getElement();
      el.classList.toggle("mission-marker--selected", mission.id === selectedMissionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions, selectedMissionId, status]);

  // Create city memory markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    for (const memory of cityMemories) {
      if (!memoryMarkersRef.current.has(memory.id)) {
        const handle = createCityMemoryMarker(map, memory, onSelectCityMemory);
        memoryMarkersRef.current.set(memory.id, handle);
      }
      const el = memoryMarkersRef.current.get(memory.id)!.marker.getElement();
      el.classList.toggle("mission-marker--selected", memory.id === selectedCityMemoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityMemories, selectedCityMemoryId, status]);

  // Fly to mission or city memory on selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    if (selectedMissionId) {
      const mission = missions.find((m) => m.id === selectedMissionId);
      if (mission) flyToMission(map, mission.lat, mission.lng);
      return;
    }
    if (selectedCityMemoryId) {
      const memory = cityMemories.find((m) => m.id === selectedCityMemoryId);
      if (memory) flyToMission(map, memory.lat, memory.lng);
      return;
    }
    flyToOverview(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMissionId, selectedCityMemoryId, status]);

  // Update DATA/BETTER overlay.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    setDataOverlaysVisible(map, mode === "DATA");

    if (mode === "REALITY") {
      setOverlayFeatures(map, []);
      return;
    }

    const points = missions.map((mission) => {
      const result = simulationResults[mission.id];
      const baseline = mission.baselineMetrics[0];
      const intensity =
        mode === "DATA"
          ? clamp01((baseline?.value ?? 0) / 100)
          : result
            ? clamp01(1 - averageAfterRatio(result))
            : clamp01((baseline?.value ?? 0) / 100) * 0.3;

      return {
        lat: mission.lat,
        lng: mission.lng,
        props: {
          missionId: mission.id,
          intensity,
          color: markerColor(mission),
          label: mission.title,
        },
      };
    });

    setOverlayFeatures(map, points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, missions, simulationResults, status]);

  return (
    <div className="city-map">
      <div ref={containerRef} className="city-map__container" />
      {status === "loading" && (
        <div className="city-map__overlay-message">Loading 3D Baltimore&hellip;</div>
      )}
      {status === "error" && (
        <div className="city-map__overlay-message city-map__overlay-message--error">
          <p>Map tiles failed to load. Check your connection and reload.</p>
          <button type="button" className="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}
    </div>
  );
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function averageAfterRatio(result: SimulationResult): number {
  if (result.before.length === 0) return 0;
  const ratios = result.before.map((before, i) => {
    const after = result.after[i];
    if (before.value === 0) return 0;
    return after.value / before.value;
  });
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}
