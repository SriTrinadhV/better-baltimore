import { schema, table, t, SenderError, type InferSchema, type ReducerCtx } from 'spacetimedb/server';

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

const playerSession = table(
  { name: 'player_session', public: true },
  {
    identity: t.identity().primaryKey(),
    displayName: t.option(t.string()),
    joinedAt: t.timestamp(),
    selectedMissionId: t.option(t.string()),
    currentMode: t.string(),
  }
);

const dataSource = table(
  { name: 'data_source', public: true },
  {
    id: t.string().primaryKey(),
    name: t.string(),
    publisher: t.string(),
    url: t.string(),
    retrievedAt: t.string(),
    observed: t.string(),
    derived: t.string(),
    simulated: t.string(),
  }
);

const mission = table(
  { name: 'mission', public: true },
  {
    id: t.string().primaryKey(),
    slug: t.string(),
    title: t.string(),
    category: t.string(),
    lat: t.f64(),
    lng: t.f64(),
    summary: t.string(),
    whyHere: t.string(),
    dataSourceId: t.option(t.string()),
    baselineMetricsJson: t.string(),
    isDeep: t.bool(),
  }
);

const intervention = table(
  { name: 'intervention', public: true },
  {
    id: t.string().primaryKey(),
    missionId: t.string().index('btree'),
    key: t.string(),
    title: t.string(),
    description: t.string(),
    parametersJson: t.string(),
  }
);

const missionState = table(
  { name: 'mission_state', public: true },
  {
    missionId: t.string().primaryKey(),
    selectedInterventionId: t.option(t.string()),
    status: t.string(),
    scenarioScore: t.f64(),
    updatedAt: t.timestamp(),
    updatedBy: t.option(t.identity()),
  }
);

const simulationRun = table(
  { name: 'simulation_run', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    missionId: t.string().index('btree'),
    interventionId: t.string(),
    baselineJson: t.string(),
    resultJson: t.string(),
    assumptionsJson: t.string(),
    createdAt: t.timestamp(),
    createdBy: t.identity(),
  }
);

const cityMemory = table(
  { name: 'city_memory', public: true },
  {
    id: t.string().primaryKey(),
    title: t.string(),
    category: t.string(),
    lat: t.f64(),
    lng: t.f64(),
    eventDate: t.string(),
    summary: t.string(),
    sourceUrl: t.string(),
    sceneJson: t.string(),
  }
);

const spacetimedb = schema({
  playerSession,
  dataSource,
  mission,
  intervention,
  missionState,
  simulationRun,
  cityMemory,
});
export default spacetimedb;

type Ctx = ReducerCtx<InferSchema<typeof spacetimedb>>;

// ---------------------------------------------------------------------------
// Bounds — reject grossly oversized payloads from any client.
// ---------------------------------------------------------------------------

const MAX_JSON_LEN = 8000;

function assertJson(value: string, label: string): void {
  if (value.length > MAX_JSON_LEN) {
    throw new SenderError(`${label} exceeds maximum size (${MAX_JSON_LEN} chars)`);
  }
  try {
    JSON.parse(value);
  } catch {
    throw new SenderError(`${label} is not valid JSON`);
  }
}

// ---------------------------------------------------------------------------
// Shared seed helpers (also used directly by the init lifecycle hook).
// ---------------------------------------------------------------------------

function upsertDataSource(
  ctx: Ctx,
  args: {
    id: string;
    name: string;
    publisher: string;
    url: string;
    retrievedAt: string;
    observed: string;
    derived: string;
    simulated: string;
  }
) {
  const existing = ctx.db.dataSource.id.find(args.id);
  if (existing) {
    ctx.db.dataSource.id.update({ ...existing, ...args });
  } else {
    ctx.db.dataSource.insert(args);
  }
}

function upsertMission(
  ctx: Ctx,
  args: {
    id: string;
    slug: string;
    title: string;
    category: string;
    lat: number;
    lng: number;
    summary: string;
    whyHere: string;
    dataSourceId: string | undefined;
    baselineMetricsJson: string;
    isDeep: boolean;
  }
) {
  const existing = ctx.db.mission.id.find(args.id);
  if (existing) {
    ctx.db.mission.id.update({ ...existing, ...args });
  } else {
    ctx.db.mission.insert(args);
  }

  const existingState = ctx.db.missionState.missionId.find(args.id);
  if (!existingState) {
    ctx.db.missionState.insert({
      missionId: args.id,
      selectedInterventionId: undefined,
      status: 'not_started',
      scenarioScore: 0,
      updatedAt: ctx.timestamp,
      updatedBy: undefined,
    });
  }
}

function upsertIntervention(
  ctx: Ctx,
  args: {
    id: string;
    missionId: string;
    key: string;
    title: string;
    description: string;
    parametersJson: string;
  }
) {
  const existing = ctx.db.intervention.id.find(args.id);
  if (existing) {
    ctx.db.intervention.id.update({ ...existing, ...args });
  } else {
    ctx.db.intervention.insert(args);
  }
}

function upsertCityMemory(
  ctx: Ctx,
  args: {
    id: string;
    title: string;
    category: string;
    lat: number;
    lng: number;
    eventDate: string;
    summary: string;
    sourceUrl: string;
    sceneJson: string;
  }
) {
  const existing = ctx.db.cityMemory.id.find(args.id);
  if (existing) {
    ctx.db.cityMemory.id.update({ ...existing, ...args });
  } else {
    ctx.db.cityMemory.insert(args);
  }
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

export const init = spacetimedb.init(() => {
  // Seed data happens via the seed_* reducers, called once after first
  // publish (see scripts/seed_spacetimedb.mjs). Kept out of `init` so
  // re-publishing during development does not silently re-seed stale data.
});

export const onConnect = spacetimedb.clientConnected(ctx => {
  const existing = ctx.db.playerSession.identity.find(ctx.sender);
  if (!existing) {
    ctx.db.playerSession.insert({
      identity: ctx.sender,
      displayName: undefined,
      joinedAt: ctx.timestamp,
      selectedMissionId: undefined,
      currentMode: 'REALITY',
    });
  }
});

export const onDisconnect = spacetimedb.clientDisconnected(() => {
  // Session rows are kept (not deleted) so completed mission state persists
  // across reconnects for the same identity.
});

// ---------------------------------------------------------------------------
// Reducers
// ---------------------------------------------------------------------------

export const ensureSession = spacetimedb.reducer(
  { displayName: t.option(t.string()) },
  (ctx, { displayName }) => {
    const existing = ctx.db.playerSession.identity.find(ctx.sender);
    if (existing) {
      ctx.db.playerSession.identity.update({ ...existing, displayName: displayName ?? existing.displayName });
    } else {
      ctx.db.playerSession.insert({
        identity: ctx.sender,
        displayName,
        joinedAt: ctx.timestamp,
        selectedMissionId: undefined,
        currentMode: 'REALITY',
      });
    }
  }
);

export const setMode = spacetimedb.reducer({ mode: t.string() }, (ctx, { mode }) => {
  if (mode !== 'REALITY' && mode !== 'DATA' && mode !== 'BETTER') {
    throw new SenderError(`Invalid mode: ${mode}`);
  }
  const existing = ctx.db.playerSession.identity.find(ctx.sender);
  if (!existing) throw new SenderError('Session not found; call ensure_session first');
  ctx.db.playerSession.identity.update({ ...existing, currentMode: mode });
});

export const seedDataSource = spacetimedb.reducer(
  {
    id: t.string(),
    name: t.string(),
    publisher: t.string(),
    url: t.string(),
    retrievedAt: t.string(),
    observed: t.string(),
    derived: t.string(),
    simulated: t.string(),
  },
  (ctx, args) => upsertDataSource(ctx, args)
);

export const seedMission = spacetimedb.reducer(
  {
    id: t.string(),
    slug: t.string(),
    title: t.string(),
    category: t.string(),
    lat: t.f64(),
    lng: t.f64(),
    summary: t.string(),
    whyHere: t.string(),
    dataSourceId: t.option(t.string()),
    baselineMetricsJson: t.string(),
    isDeep: t.bool(),
  },
  (ctx, args) => {
    assertJson(args.baselineMetricsJson, 'baselineMetricsJson');
    upsertMission(ctx, { ...args, dataSourceId: args.dataSourceId });
  }
);

export const seedIntervention = spacetimedb.reducer(
  {
    id: t.string(),
    missionId: t.string(),
    key: t.string(),
    title: t.string(),
    description: t.string(),
    parametersJson: t.string(),
  },
  (ctx, args) => {
    assertJson(args.parametersJson, 'parametersJson');
    if (!ctx.db.mission.id.find(args.missionId)) {
      throw new SenderError(`Unknown mission: ${args.missionId}`);
    }
    upsertIntervention(ctx, args);
  }
);

export const seedCityMemory = spacetimedb.reducer(
  {
    id: t.string(),
    title: t.string(),
    category: t.string(),
    lat: t.f64(),
    lng: t.f64(),
    eventDate: t.string(),
    summary: t.string(),
    sourceUrl: t.string(),
    sceneJson: t.string(),
  },
  (ctx, args) => {
    assertJson(args.sceneJson, 'sceneJson');
    upsertCityMemory(ctx, args);
  }
);

export const chooseIntervention = spacetimedb.reducer(
  { missionId: t.string(), interventionId: t.string() },
  (ctx, { missionId, interventionId }) => {
    const missionRow = ctx.db.mission.id.find(missionId);
    if (!missionRow) throw new SenderError(`Unknown mission: ${missionId}`);

    const interventionRow = ctx.db.intervention.id.find(interventionId);
    if (!interventionRow || interventionRow.missionId !== missionId) {
      throw new SenderError(`Intervention ${interventionId} does not belong to mission ${missionId}`);
    }

    const state = ctx.db.missionState.missionId.find(missionId);
    if (!state) throw new SenderError(`Missing mission_state for ${missionId}`);

    ctx.db.missionState.missionId.update({
      ...state,
      selectedInterventionId: interventionId,
      status: 'in_progress',
      updatedAt: ctx.timestamp,
      updatedBy: ctx.sender,
    });
  }
);

export const runSimulation = spacetimedb.reducer(
  {
    missionId: t.string(),
    interventionId: t.string(),
    resultJson: t.string(),
    assumptionsJson: t.string(),
  },
  (ctx, { missionId, interventionId, resultJson, assumptionsJson }) => {
    const missionRow = ctx.db.mission.id.find(missionId);
    if (!missionRow) throw new SenderError(`Unknown mission: ${missionId}`);

    const interventionRow = ctx.db.intervention.id.find(interventionId);
    if (!interventionRow || interventionRow.missionId !== missionId) {
      throw new SenderError(`Intervention ${interventionId} does not belong to mission ${missionId}`);
    }

    assertJson(resultJson, 'resultJson');
    assertJson(assumptionsJson, 'assumptionsJson');

    // The server's stored baseline is authoritative — the client's copy of
    // "before" metrics is never trusted for persistence, only its computed
    // "after"/assumptions are recorded alongside our own baseline snapshot.
    ctx.db.simulationRun.insert({
      id: 0n,
      missionId,
      interventionId,
      baselineJson: missionRow.baselineMetricsJson,
      resultJson,
      assumptionsJson,
      createdAt: ctx.timestamp,
      createdBy: ctx.sender,
    });

    const scenarioScore = scoreFromResult(resultJson);

    const state = ctx.db.missionState.missionId.find(missionId);
    if (state) {
      ctx.db.missionState.missionId.update({
        ...state,
        status: 'completed',
        scenarioScore,
        updatedAt: ctx.timestamp,
        updatedBy: ctx.sender,
      });
    }
  }
);

export const resetMission = spacetimedb.reducer({ missionId: t.string() }, (ctx, { missionId }) => {
  const state = ctx.db.missionState.missionId.find(missionId);
  if (!state) throw new SenderError(`Missing mission_state for ${missionId}`);
  ctx.db.missionState.missionId.update({
    ...state,
    selectedInterventionId: undefined,
    status: 'not_started',
    scenarioScore: 0,
    updatedAt: ctx.timestamp,
    updatedBy: ctx.sender,
  });
});

/** Rough scenario-impact score: sum of absolute deltas, clamped to a display-friendly range. */
function scoreFromResult(resultJson: string): number {
  try {
    const parsed = JSON.parse(resultJson) as { deltas?: Array<{ value?: number }> };
    const total = (parsed.deltas ?? []).reduce((sum, d) => sum + Math.abs(d.value ?? 0), 0);
    return Math.min(100, Math.round(total * 10) / 10);
  } catch {
    return 0;
  }
}
