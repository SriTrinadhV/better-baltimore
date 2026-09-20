import { useState } from "react";
import type { DataSource, Intervention, Mission, SimulationResult } from "../app/types";
import { SourcePanel } from "./SourcePanel";
import { InterventionPicker } from "./InterventionPicker";
import { BeforeAfter } from "./BeforeAfter";

interface Props {
  mission: Mission;
  source: DataSource | null;
  simulationResult: SimulationResult | null;
  onRunSimulation: (mission: Mission, intervention: Intervention) => void;
  onClose: () => void;
}

export function MissionPanel({ mission, source, simulationResult, onRunSimulation, onClose }: Props) {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  return (
    <div className="mission-panel" role="dialog" aria-label={`${mission.title} mission panel`}>
      <button type="button" className="mission-panel__close" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <h2 className="mission-panel__title">{mission.title}</h2>
      <p className="mission-panel__summary">{mission.summary}</p>

      <section>
        <h3 className="panel-heading">Why here?</h3>
        <p>{mission.whyHere}</p>
      </section>

      <section>
        <h3 className="panel-heading">Observed metrics</h3>
        <ul className="metric-list">
          {mission.baselineMetrics.map((m) => (
            <li key={m.key}>
              <span>{m.label}</span>
              <span>
                {m.value} {m.unit}
              </span>
              <span className={`provenance-tag provenance-tag--${m.provenance}`}>{m.provenance}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="panel-heading">Source</h3>
        <SourcePanel source={source} isDeep={mission.isDeep} />
      </section>

      <section>
        <InterventionPicker
          interventions={mission.interventions}
          selectedId={selectedIntervention?.id ?? null}
          onSelect={setSelectedIntervention}
          canSimulate={Boolean(selectedIntervention)}
          onSimulate={() => selectedIntervention && onRunSimulation(mission, selectedIntervention)}
        />
      </section>

      {simulationResult && (
        <section>
          <BeforeAfter result={simulationResult} />
        </section>
      )}
    </div>
  );
}
