import { useMemo, useState } from "react";
import "./App.css";
import type { CityMemory, Intervention, Mission, ViewMode } from "./app/types";
import { runSimulation } from "./simulation/engine";
import { useSpacetimeData } from "./data/client";
import { findSource } from "./data/provenance";
import { ModeSwitch } from "./components/ModeSwitch";
import { MissionList } from "./components/MissionList";
import { CityMap } from "./components/CityMap";
import { MissionPanel } from "./components/MissionPanel";
import { CityMemoryPanel } from "./components/CityMemoryPanel";
import { CivicCopilot } from "./components/CivicCopilot";

type Screen = "landing" | "explore";

function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [mode, setMode] = useState<ViewMode>("REALITY");
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedCityMemoryId, setSelectedCityMemoryId] = useState<string | null>(null);
  const {
    connected,
    missions,
    dataSources,
    cityMemories,
    simulationResults,
    chooseIntervention,
    persistSimulation,
  } = useSpacetimeData();

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedMissionId) ?? null,
    [missions, selectedMissionId],
  );

  const selectedCityMemory = useMemo(
    () => cityMemories.find((m) => m.id === selectedCityMemoryId) ?? null,
    [cityMemories, selectedCityMemoryId],
  );

  function handleSelectMission(mission: Mission) {
    setSelectedCityMemoryId(null);
    setSelectedMissionId(mission.id);
  }

  function handleSelectCityMemory(memory: CityMemory) {
    setSelectedMissionId(null);
    setSelectedCityMemoryId(memory.id);
  }

  function handleRunSimulation(mission: Mission, intervention: Intervention) {
    chooseIntervention(mission.id, intervention.id);
    const result = runSimulation(mission, intervention.key, intervention.parameters);
    persistSimulation(mission.id, intervention.id, result);
  }

  if (screen === "landing") {
    return (
      <div className="landing">
        <h1>Better Baltimore</h1>
        <p>
          Baltimore publishes rich civic data, but most residents never explore it. Better Baltimore turns that
          data into a city you can step into, test interventions in, and compare before and after.
        </p>
        <div className="landing__actions">
          <button type="button" className="button button--primary" onClick={() => setScreen("explore")}>
            Explore Baltimore
          </button>
          <a
            className="button"
            href="https://docs.marimo.io/"
            target="_blank"
            rel="noreferrer"
            title="Run: marimo run analysis/better_baltimore.py"
          >
            Open Data Command Center
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__title">Better Baltimore</span>
        <ModeSwitch mode={mode} onChange={setMode} />
        <span className={`connection-badge ${connected ? "connection-badge--connected" : ""}`}>
          {connected ? "SpacetimeDB connected" : "Connecting to SpacetimeDB…"}
        </span>
      </header>
      <div className={`app__body ${selectedMission || selectedCityMemory ? "app__body--with-panel" : ""}`}>
        <aside className="sidebar">
          <MissionList missions={missions} selectedId={selectedMissionId} onSelect={handleSelectMission} />
        </aside>
        <CityMap
          missions={missions}
          cityMemories={cityMemories}
          mode={mode}
          selectedMissionId={selectedMissionId}
          selectedCityMemoryId={selectedCityMemoryId}
          simulationResults={simulationResults}
          onSelectMission={handleSelectMission}
          onSelectCityMemory={handleSelectCityMemory}
        />
        {selectedMission && (
          <MissionPanel
            mission={selectedMission}
            source={findSource(dataSources, selectedMission.dataSourceId)}
            simulationResult={simulationResults[selectedMission.id] ?? null}
            onRunSimulation={handleRunSimulation}
            onClose={() => setSelectedMissionId(null)}
          />
        )}
        {selectedCityMemory && (
          <CityMemoryPanel
            memory={selectedCityMemory}
            onRelive={() => {}}
            onClose={() => setSelectedCityMemoryId(null)}
          />
        )}
      </div>
      <CivicCopilot missions={missions} dataSources={dataSources} simulationResults={simulationResults} />
      <footer className="legend">
        <span className="legend__item">
          <span className="legend__dot" style={{ background: "#2f9e44" }} /> Tree Canopy
        </span>
        <span className="legend__item">
          <span className="legend__dot" style={{ background: "#e8590c" }} /> Vacant Buildings
        </span>
        <span className="legend__item">
          <span className="legend__dot" style={{ background: "#1971c2" }} /> Floodplain
        </span>
        <span className="legend__item">
          <span className="legend__dot" style={{ background: "#868e96" }} /> Scenario missions
        </span>
        <span style={{ marginLeft: "auto" }}>
          {mode === "DATA" && "Data view: circle size reflects observed/derived problem intensity."}
          {mode === "BETTER" && "Better view: circle size reflects simulated post-intervention effect."}
          {mode === "REALITY" && "Reality view: click a marker to inspect a mission."}
        </span>
      </footer>
    </div>
  );
}

export default App;
