import type { DataSource, Mission, SimulationResult } from "../app/types";

export interface Chunk {
  id: string;
  missionId: string | null;
  sourceId: string | null;
  title: string;
  text: string;
  url: string | null;
}

export function buildCorpus(
  missions: Mission[],
  dataSources: DataSource[],
  simulationResults: Record<string, SimulationResult>,
): Chunk[] {
  const chunks: Chunk[] = [];

  for (const source of dataSources) {
    chunks.push({
      id: `source-${source.id}`,
      missionId: null,
      sourceId: source.id,
      title: source.name,
      text:
        `${source.name}, published by ${source.publisher}, retrieved ${source.retrievedAt}. ` +
        `Observed: ${source.observed}. Derived: ${source.derived}. Simulated: ${source.simulated}.`,
      url: source.url,
    });
  }

  for (const mission of missions) {
    chunks.push({
      id: `mission-${mission.id}-why`,
      missionId: mission.id,
      sourceId: mission.dataSourceId,
      title: `${mission.title} — why here`,
      text: `${mission.summary} ${mission.whyHere}`,
      url: null,
    });

    if (mission.baselineMetrics.length > 0) {
      chunks.push({
        id: `mission-${mission.id}-metrics`,
        missionId: mission.id,
        sourceId: mission.dataSourceId,
        title: `${mission.title} — baseline metrics`,
        text: mission.baselineMetrics
          .map((m) => `${m.label}: ${m.value} ${m.unit} (${m.provenance})`)
          .join("; "),
        url: null,
      });
    }

    for (const intervention of mission.interventions) {
      chunks.push({
        id: `intervention-${intervention.id}`,
        missionId: mission.id,
        sourceId: null,
        title: `${mission.title} — ${intervention.title}`,
        text: intervention.description,
        url: null,
      });
    }

    const result = simulationResults[mission.id];
    if (result) {
      chunks.push({
        id: `mission-${mission.id}-assumptions`,
        missionId: mission.id,
        sourceId: null,
        title: `${mission.title} — simulation assumptions`,
        text: `${result.assumptions.join(" ")} Confidence: ${result.confidence}.`,
        url: null,
      });
    }
  }

  return chunks;
}
