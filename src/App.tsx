import { useEffect, useMemo, useState } from "react";
import "./App.css";
import type { DataSource, Intervention, Mission, SimulationResult, ViewMode } from "./app/types";
import { SEED_MISSIONS } from "./data/missions.seed";
import { loadDataSources, findSource } from "./data/provenance";
import { runSimulation } from "./simulation/engine";
import { ModeSwitch } from "./components/ModeSwitch";
import { MissionList } from "./components/MissionList";
import { CityMap } from "./components/CityMap";
import { MissionPanel } from "./components/MissionPanel";

type Screen = "landing" | "explore";

function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [missions, setMissions] = useState<Mission[]>(SEED_MISSIONS);
  const [mode, setMode] = useState<ViewMode>("REALITY");
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({});
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    loadDataSources()
      .then(setDataSources)
      .catch((err) => setDataError(String(err)));
  }, []);

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedMissionId) ?? null,
    [missions, selectedMissionId],
  );

  function handleSelectMission(mission: Mission) {
    setSelectedMissionId(mission.id);
  }

  function handleRunSimulation(mission: Mission, intervention: Intervention) {
    const result = runSimulation(mission, intervention.key, intervention.parameters);
    setSimulationResults((prev) => ({ ...prev, [mission.id]: result }));
    setMissions((prev) =>
      prev.map((m) => (m.id === mission.id ? { ...m, status: "completed" } : m)),
    );
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
        {dataError && <p style={{ color: "#ff9c9c" }}>Failed to load data sources: {dataError}</p>}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__title">Better Baltimore</span>
        <ModeSwitch mode={mode} onChange={setMode} />
        <span className="connection-badge">Local mode (SpacetimeDB not yet connected)</span>
      </header>
      <div className={`app__body ${selectedMission ? "app__body--with-panel" : ""}`}>
        <aside className="sidebar">
          <MissionList missions={missions} selectedId={selectedMissionId} onSelect={handleSelectMission} />
        </aside>
        <CityMap
          missions={missions}
          mode={mode}
          selectedMissionId={selectedMissionId}
          simulationResults={simulationResults}
          onSelectMission={handleSelectMission}
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
      </div>
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
