import { useEffect, useRef, useState } from "react";
import { connect } from "../spacetime/connection";
import type { DbConnection } from "../spacetime/module_bindings";
import type { DataSource, Intervention, Mission, Metric, SimulationResult, ViewMode } from "../app/types";
import { SEED_MISSIONS } from "./missions.seed";

interface MissionRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  summary: string;
  whyHere: string;
  dataSourceId?: string;
  baselineMetricsJson: string;
  isDeep: boolean;
}

interface InterventionRow {
  id: string;
  missionId: string;
  key: string;
  title: string;
  description: string;
  parametersJson: string;
}

interface MissionStateRow {
  missionId: string;
  selectedInterventionId?: string;
  status: string;
  scenarioScore: number;
}

interface DataSourceRow {
  id: string;
  name: string;
  publisher: string;
  url: string;
  retrievedAt: string;
  observed: string;
  derived: string;
  simulated: string;
}

interface SimulationRunRow {
  id: bigint;
  missionId: string;
  resultJson: string;
  assumptionsJson: string;
}

interface StoredSimResult {
  before: Metric[];
  after: Metric[];
  deltas: Metric[];
  confidence: SimulationResult["confidence"];
}

export interface SpacetimeData {
  connected: boolean;
  missions: Mission[];
  dataSources: DataSource[];
  simulationResults: Record<string, SimulationResult>;
  chooseIntervention: (missionId: string, interventionId: string) => void;
  persistSimulation: (missionId: string, interventionId: string, result: SimulationResult) => void;
  resetMission: (missionId: string) => void;
  setServerMode: (mode: ViewMode) => void;
}

export function useSpacetimeData(): SpacetimeData {
  const connRef = useRef<DbConnection | null>(null);
  const seededRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [missionRows, setMissionRows] = useState<Record<string, MissionRow>>({});
  const [interventionRows, setInterventionRows] = useState<Record<string, InterventionRow>>({});
  const [missionStateRows, setMissionStateRows] = useState<Record<string, MissionStateRow>>({});
  const [dataSourceRows, setDataSourceRows] = useState<Record<string, DataSourceRow>>({});
  const [simRunsByMission, setSimRunsByMission] = useState<Record<string, SimulationRunRow>>({});

  useEffect(() => {
    const conn = connect({
      onConnect: (c) => {
        setConnected(true);
        void c.reducers.ensureSession({ displayName: undefined });

        c.db.mission.onInsert((_ctx, row) => setMissionRows((prev) => ({ ...prev, [row.id]: row })));
        c.db.mission.onUpdate((_ctx, _old, row) => setMissionRows((prev) => ({ ...prev, [row.id]: row })));
        c.db.mission.onDelete((_ctx, row) =>
          setMissionRows((prev) => {
            const next = { ...prev };
            delete next[row.id];
            return next;
          }),
        );

        c.db.intervention.onInsert((_ctx, row) => setInterventionRows((prev) => ({ ...prev, [row.id]: row })));
        c.db.intervention.onUpdate((_ctx, _old, row) =>
          setInterventionRows((prev) => ({ ...prev, [row.id]: row })),
        );

        c.db.missionState.onInsert((_ctx, row) =>
          setMissionStateRows((prev) => ({ ...prev, [row.missionId]: row })),
        );
        c.db.missionState.onUpdate((_ctx, _old, row) =>
          setMissionStateRows((prev) => ({ ...prev, [row.missionId]: row })),
        );

        c.db.dataSource.onInsert((_ctx, row) => setDataSourceRows((prev) => ({ ...prev, [row.id]: row })));
        c.db.dataSource.onUpdate((_ctx, _old, row) => setDataSourceRows((prev) => ({ ...prev, [row.id]: row })));

        c.db.simulationRun.onInsert((_ctx, row) =>
          setSimRunsByMission((prev) => ({ ...prev, [row.missionId]: row })),
        );

        c.subscriptionBuilder()
          .onApplied(() => {
            if (!seededRef.current && c.db.mission.count() === 0n) {
              seededRef.current = true;
              seedInitialData(c);
            }
          })
          .subscribe([
            "SELECT * FROM mission",
            "SELECT * FROM intervention",
            "SELECT * FROM mission_state",
            "SELECT * FROM data_source",
            "SELECT * FROM simulation_run",
          ]);
      },
      onDisconnect: () => setConnected(false),
      onConnectError: (err) => console.error("SpacetimeDB connection error", err),
    });
    connRef.current = conn;

    return () => {
      conn.disconnect();
      connRef.current = null;
    };
  }, []);

  const missions: Mission[] = Object.values(missionRows)
    .map((row) => toMission(row, interventionRows, missionStateRows))
    .sort((a, b) => SEED_MISSIONS.findIndex((m) => m.id === a.id) - SEED_MISSIONS.findIndex((m) => m.id === b.id));

  const dataSources: DataSource[] = Object.values(dataSourceRows);

  const simulationResults: Record<string, SimulationResult> = {};
  for (const [missionId, run] of Object.entries(simRunsByMission)) {
    try {
      const parsed = JSON.parse(run.resultJson) as StoredSimResult;
      const assumptions = JSON.parse(run.assumptionsJson) as string[];
      simulationResults[missionId] = { ...parsed, assumptions };
    } catch {
      // Ignore malformed rows rather than crashing the UI.
    }
  }

  return {
    connected,
    missions: missions.length > 0 ? missions : SEED_MISSIONS,
    dataSources,
    simulationResults,
    chooseIntervention: (missionId, interventionId) => {
      void connRef.current?.reducers.chooseIntervention({ missionId, interventionId });
    },
    persistSimulation: (missionId, interventionId, result) => {
      const resultJson = JSON.stringify({
        before: result.before,
        after: result.after,
        deltas: result.deltas,
        confidence: result.confidence,
      } satisfies StoredSimResult);
      void connRef.current?.reducers.runSimulation({
        missionId,
        interventionId,
        resultJson,
        assumptionsJson: JSON.stringify(result.assumptions),
      });
    },
    resetMission: (missionId) => {
      void connRef.current?.reducers.resetMission({ missionId });
    },
    setServerMode: (mode) => {
      void connRef.current?.reducers.setMode({ mode });
    },
  };
}

function toMission(
  row: MissionRow,
  interventionRows: Record<string, InterventionRow>,
  missionStateRows: Record<string, MissionStateRow>,
): Mission {
  const interventions: Intervention[] = Object.values(interventionRows)
    .filter((i) => i.missionId === row.id)
    .map((i) => ({
      id: i.id,
      missionId: i.missionId,
      key: i.key,
      title: i.title,
      description: i.description,
      parameters: safeParse<Record<string, number>>(i.parametersJson, {}),
    }));

  const state = missionStateRows[row.id];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    lat: row.lat,
    lng: row.lng,
    summary: row.summary,
    whyHere: row.whyHere,
    dataSourceId: row.dataSourceId ?? null,
    baselineMetrics: safeParse<Metric[]>(row.baselineMetricsJson, []),
    interventions,
    isDeep: row.isDeep,
    status: (state?.status as Mission["status"]) ?? "not_started",
  };
}

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function seedInitialData(conn: DbConnection): void {
  fetch("/data/sources.json")
    .then((r) => r.json())
    .then((sources: DataSource[]) => {
      for (const s of sources) {
        void conn.reducers.seedDataSource(s);
      }
    })
    .catch((err) => console.error("Failed to seed data sources", err));

  for (const mission of SEED_MISSIONS) {
    void conn.reducers.seedMission({
      id: mission.id,
      slug: mission.slug,
      title: mission.title,
      category: mission.category,
      lat: mission.lat,
      lng: mission.lng,
      summary: mission.summary,
      whyHere: mission.whyHere,
      dataSourceId: mission.dataSourceId ?? undefined,
      baselineMetricsJson: JSON.stringify(mission.baselineMetrics),
      isDeep: mission.isDeep,
    });
    for (const intervention of mission.interventions) {
      void conn.reducers.seedIntervention({
        id: intervention.id,
        missionId: intervention.missionId,
        key: intervention.key,
        title: intervention.title,
        description: intervention.description,
        parametersJson: JSON.stringify(intervention.parameters),
      });
    }
  }
}
