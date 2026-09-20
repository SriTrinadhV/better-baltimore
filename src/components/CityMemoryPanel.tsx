import { useState } from "react";
import type { CityMemory } from "../app/types";

interface Props {
  memory: CityMemory;
  onRelive: () => void;
  onClose: () => void;
}

export function CityMemoryPanel({ memory, onRelive, onClose }: Props) {
  const [reliving, setReliving] = useState(false);

  return (
    <div className="mission-panel" role="dialog" aria-label={`${memory.title} city memory`}>
      <button type="button" className="mission-panel__close" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <span className="badge badge--observed">City Memory</span>
      <h2 className="mission-panel__title">{memory.title}</h2>
      <p className="mission-panel__summary">
        {memory.category} &middot; {memory.eventDate}
      </p>

      <section>
        <h3 className="panel-heading">About</h3>
        <p>{memory.summary}</p>
        <p style={{ marginTop: 8 }}>
          <a href={memory.sourceUrl} target="_blank" rel="noreferrer">
            {memory.sourceUrl}
          </a>
        </p>
      </section>

      <section>
        <button
          type="button"
          className="button button--primary"
          onClick={() => {
            setReliving(true);
            onRelive();
          }}
        >
          Relive this moment
        </button>
        {reliving && (
          <p style={{ marginTop: 12, fontStyle: "italic", color: "var(--text-dim)" }}>{memory.narrative}</p>
        )}
      </section>
    </div>
  );
}
