import type { Mission } from "../app/types";
import { markerColor } from "../map/missions";

interface Props {
  missions: Mission[];
  selectedId: string | null;
  onSelect: (mission: Mission) => void;
}

export function MissionList({ missions, selectedId, onSelect }: Props) {
  return (
    <div className="mission-list" aria-label="Missions">
      <h2 className="panel-heading">Missions</h2>
      <ul>
        {missions.map((mission) => (
          <li key={mission.id}>
            <button
              type="button"
              className={`mission-list__item ${selectedId === mission.id ? "mission-list__item--active" : ""}`}
              onClick={() => onSelect(mission)}
            >
              <span className="mission-list__dot" style={{ backgroundColor: markerColor(mission) }} />
              <span className="mission-list__text">
                <span className="mission-list__title">{mission.title}</span>
                <span className="mission-list__category">
                  {mission.isDeep ? mission.category : `${mission.category}`}
                </span>
              </span>
              {mission.status === "completed" && <span className="mission-list__badge">done</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
