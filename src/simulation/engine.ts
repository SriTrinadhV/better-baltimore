import type { Mission, Metric, SimulationResult } from "../app/types";

type SimFn = (mission: Mission, interventionKey: string, parameters: Record<string, number>) => SimulationResult;

function metric(base: Metric, value: number): Metric {
  return { ...base, value: Math.round(value * 10) / 10 };
}

function findMetric(metrics: Metric[], key: string): Metric {
  const found = metrics.find((m) => m.key === key);
  if (!found) throw new Error(`Missing baseline metric: ${key}`);
  return found;
}

const coolTheBlock: SimFn = (mission, _key, params) => {
  const intensity = clamp(params.intensity ?? 0.5, 0, 1);
  const canopy = findMetric(mission.baselineMetrics, "canopy_pct");
  const green = findMetric(mission.baselineMetrics, "green_score");
  const afterCanopy = metric(
    { ...canopy, provenance: "simulated" },
    Math.min(100, canopy.value + intensity * 20),
  );
  const afterGreen = metric(
    { ...green, provenance: "simulated" },
    Math.min(100, green.value + intensity * 25),
  );
  return {
    before: [canopy, green],
    after: [afterCanopy, afterGreen],
    deltas: [delta(canopy, afterCanopy), delta(green, afterGreen)],
    assumptions: [
      "Canopy proxy increases linearly with intervention intensity, capped at 100%.",
      "Green exposure score is a normalized scenario index, not a temperature measurement.",
    ],
    confidence: "illustrative",
  };
};

const reclaimTheLot: SimFn = (mission, _key, params) => {
  const parcels = Math.max(0, Math.round(params.parcels ?? 4));
  const vacant = findMetric(mission.baselineMetrics, "vacant_count");
  const density = findMetric(mission.baselineMetrics, "vacancy_density");
  const remaining = Math.max(0, vacant.value - parcels);
  const afterVacant = metric({ ...vacant, provenance: "simulated" }, remaining);
  const reuseShare = vacant.value > 0 ? (vacant.value - remaining) / vacant.value : 0;
  const afterDensity = metric(
    { ...density, provenance: "simulated" },
    Math.max(0, density.value * (1 - reuseShare)),
  );
  return {
    before: [vacant, density],
    after: [afterVacant, afterDensity],
    deltas: [delta(vacant, afterVacant), delta(density, afterDensity)],
    assumptions: [
      "Each selected parcel is assumed reused; remaining vacancy count is baseline minus parcels reused.",
      "Vacancy density score scales down proportionally to the reuse share.",
    ],
    confidence: "illustrative",
  };
};

const cleanTheStreets: SimFn = (mission, _key, params) => {
  const capacity = clamp(params.capacity ?? 0.4, 0, 1);
  const pressure = findMetric(mission.baselineMetrics, "issue_pressure");
  const after = metric({ ...pressure, provenance: "simulated" }, Math.max(0, pressure.value * (1 - capacity)));
  return {
    before: [pressure],
    after: [after],
    deltas: [delta(pressure, after)],
    assumptions: [
      "Modeled unresolved-request pressure decreases proportionally to intervention capacity.",
      "This is a scenario simulation, not a measurement of actual cleanup activity.",
    ],
    confidence: "illustrative",
  };
};

const floodReady: SimFn = (mission, _key, params) => {
  const coverage = clamp(params.coverage ?? 0.3, 0, 1);
  const overlap = findMetric(mission.baselineMetrics, "floodplain_overlap");
  const resilience = findMetric(mission.baselineMetrics, "resilience_score");
  const afterResilience = metric(
    { ...resilience, provenance: "simulated" },
    Math.min(100, resilience.value + coverage * 50),
  );
  return {
    before: [overlap, resilience],
    after: [overlap, afterResilience],
    deltas: [delta(overlap, overlap), delta(resilience, afterResilience)],
    assumptions: [
      "Floodplain overlap is observed official geography and is not changed by the scenario.",
      "Resilience score is a scenario index based on treated-area coverage, not a hydraulic engineering forecast.",
    ],
    confidence: "illustrative",
  };
};

const parkSmarter: SimFn = (mission, _key, params) => {
  const walkMinutes = Math.max(0, params.walkMinutes ?? 1);
  const demand = findMetric(mission.baselineMetrics, "demand_pressure");
  const reduction = clamp(walkMinutes / 8, 0, 0.7);
  const after = metric({ ...demand, provenance: "simulated" }, Math.max(0, demand.value * (1 - reduction)));
  return {
    before: [demand],
    after: [after],
    deltas: [delta(demand, after)],
    assumptions: [
      "Demand pressure is modeled as decreasing with distance from the highest-pressure option.",
      "No live occupancy data is used; this is a documented scenario simulation.",
    ],
    confidence: "illustrative",
  };
};

const saferStreets: SimFn = (mission, _key, params) => {
  const intensity = clamp(params.intensity ?? 0.5, 0, 1);
  const risk = findMetric(mission.baselineMetrics, "risk_score");
  const after = metric({ ...risk, provenance: "simulated" }, Math.max(0, risk.value * (1 - intensity * 0.6)));
  return {
    before: [risk],
    after: [after],
    deltas: [delta(risk, after)],
    assumptions: [
      "Risk score decreases with intervention intensity using a simple weighted formula.",
      "This does not claim a measured reduction in crashes or incidents.",
    ],
    confidence: "illustrative",
  };
};

const ENGINES: Record<string, SimFn> = {
  "cool-the-block": coolTheBlock,
  "reclaim-the-lot": reclaimTheLot,
  "clean-the-streets": cleanTheStreets,
  "flood-ready": floodReady,
  "park-smarter": parkSmarter,
  "safer-streets": saferStreets,
};

export function runSimulation(
  mission: Mission,
  interventionKey: string,
  parameters: Record<string, number>,
): SimulationResult {
  const engine = ENGINES[mission.id];
  if (!engine) throw new Error(`No simulation engine registered for mission: ${mission.id}`);
  return engine(mission, interventionKey, parameters);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function delta(before: Metric, after: Metric): Metric {
  return {
    key: `${before.key}_delta`,
    label: `${before.label} change`,
    value: Math.round((after.value - before.value) * 10) / 10,
    unit: before.unit,
    provenance: "simulated",
  };
}
