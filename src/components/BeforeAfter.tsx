import type { SimulationResult } from "../app/types";

interface Props {
  result: SimulationResult;
}

export function BeforeAfter({ result }: Props) {
  return (
    <div className="before-after">
      <h3 className="panel-heading">Before / after</h3>
      <span className={`badge badge--confidence-${result.confidence}`}>{result.confidence} scenario</span>
      <table className="before-after__table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Before</th>
            <th>After</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {result.before.map((before, i) => {
            const after = result.after[i];
            const d = result.deltas[i];
            return (
              <tr key={before.key}>
                <td>{before.label}</td>
                <td>
                  {before.value} {before.unit}
                  <span className={`provenance-tag provenance-tag--${before.provenance}`}>{before.provenance}</span>
                </td>
                <td>
                  {after.value} {after.unit}
                  <span className={`provenance-tag provenance-tag--${after.provenance}`}>{after.provenance}</span>
                </td>
                <td className={d.value >= 0 ? "delta-positive" : "delta-negative"}>
                  {d.value > 0 ? "+" : ""}
                  {d.value} {d.unit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="before-after__assumptions">
        <strong>Assumptions:</strong>
        <ul>
          {result.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
