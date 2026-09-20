import type { ViewMode } from "../app/types";

const MODES: ViewMode[] = ["REALITY", "DATA", "BETTER"];

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <div className="mode-switch" role="tablist" aria-label="City view mode">
      {MODES.map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          className={`mode-switch__button ${mode === m ? "mode-switch__button--active" : ""}`}
          onClick={() => onChange(m)}
          type="button"
        >
          {m}
        </button>
      ))}
    </div>
  );
}
