import type { DataSource } from "../app/types";

interface Props {
  source: DataSource | null;
  isDeep: boolean;
}

export function SourcePanel({ source, isDeep }: Props) {
  if (!isDeep || !source) {
    return (
      <div className="source-panel source-panel--scenario">
        <span className="badge badge--simulated">Scenario simulation</span>
        <p>
          This mission is not yet backed by a verified real-time city dataset. Values shown are clearly labeled
          scenario simulations, not measured facts.
        </p>
      </div>
    );
  }

  return (
    <div className="source-panel">
      <span className="badge badge--observed">Observed data</span>
      <dl>
        <dt>Source</dt>
        <dd>{source.name}</dd>
        <dt>Publisher</dt>
        <dd>{source.publisher}</dd>
        <dt>Retrieved</dt>
        <dd>{source.retrievedAt}</dd>
        <dt>URL</dt>
        <dd>
          <a href={source.url} target="_blank" rel="noreferrer">
            {source.url}
          </a>
        </dd>
      </dl>
      <div className="source-panel__labels">
        <p>
          <strong>Observed:</strong> {source.observed}
        </p>
        <p>
          <strong>Derived:</strong> {source.derived}
        </p>
        <p>
          <strong>Simulated:</strong> {source.simulated}
        </p>
      </div>
    </div>
  );
}
