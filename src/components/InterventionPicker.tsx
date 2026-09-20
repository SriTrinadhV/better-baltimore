import type { Intervention } from "../app/types";

interface Props {
  interventions: Intervention[];
  selectedId: string | null;
  onSelect: (intervention: Intervention) => void;
  onSimulate: () => void;
  canSimulate: boolean;
}

export function InterventionPicker({ interventions, selectedId, onSelect, onSimulate, canSimulate }: Props) {
  return (
    <div className="intervention-picker">
      <h3 className="panel-heading">Choose an intervention</h3>
      <div className="intervention-picker__options">
        {interventions.map((intervention) => (
          <button
            key={intervention.id}
            type="button"
            className={`intervention-picker__option ${
              selectedId === intervention.id ? "intervention-picker__option--active" : ""
            }`}
            onClick={() => onSelect(intervention)}
          >
            <span className="intervention-picker__title">{intervention.title}</span>
            <span className="intervention-picker__description">{intervention.description}</span>
          </button>
        ))}
      </div>
      <button type="button" className="button button--primary" onClick={onSimulate} disabled={!canSimulate}>
        Run simulation
      </button>
    </div>
  );
}
