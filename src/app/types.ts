export type ViewMode = "REALITY" | "DATA" | "BETTER";

export type Provenance = "observed" | "derived" | "simulated";

export interface Metric {
  key: string;
  label: string;
  value: number;
  unit: string;
  provenance: Provenance;
}

export interface DataSource {
  id: string;
  name: string;
  publisher: string;
  url: string;
  retrievedAt: string;
  observed: string;
  derived: string;
  simulated: string;
}

export interface Intervention {
  id: string;
  missionId: string;
  key: string;
  title: string;
  description: string;
  parameters: Record<string, number>;
}

export interface Mission {
  id: string;
  slug: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  summary: string;
  whyHere: string;
  dataSourceId: string | null;
  baselineMetrics: Metric[];
  interventions: Intervention[];
  isDeep: boolean;
  status: "not_started" | "in_progress" | "completed";
}

export interface SimulationResult {
  before: Metric[];
  after: Metric[];
  deltas: Metric[];
  assumptions: string[];
  confidence: "illustrative" | "low" | "medium" | "high";
}
