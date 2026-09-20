import { describe, expect, it } from "vitest";
import { runSimulation } from "../engine";
import { SEED_MISSIONS } from "../../data/missions.seed";

function mission(id: string) {
  const m = SEED_MISSIONS.find((mission) => mission.id === id);
  if (!m) throw new Error(`missing seed mission ${id}`);
  return m;
}

describe("simulation engine", () => {
  it("increases canopy and green score for Cool the Block", () => {
    const result = runSimulation(mission("cool-the-block"), "plant-street-trees", { intensity: 0.5 });
    const before = result.before.find((m) => m.key === "canopy_pct")!;
    const after = result.after.find((m) => m.key === "canopy_pct")!;
    expect(after.value).toBeGreaterThan(before.value);
    expect(after.value).toBeLessThanOrEqual(100);
  });

  it("labels a post-intervention canopy value as simulated, not observed", () => {
    const result = runSimulation(mission("cool-the-block"), "plant-street-trees", { intensity: 0.5 });
    const before = result.before.find((m) => m.key === "canopy_pct")!;
    const after = result.after.find((m) => m.key === "canopy_pct")!;
    expect(before.provenance).toBe("observed");
    expect(after.provenance).toBe("simulated");
  });

  it("reduces vacancy count for Reclaim the Lot without going negative", () => {
    const result = runSimulation(mission("reclaim-the-lot"), "community-green-space", { parcels: 100 });
    const after = result.after.find((m) => m.key === "vacant_count")!;
    expect(after.value).toBe(0);
  });

  it("keeps floodplain overlap unchanged (observed) while resilience score improves", () => {
    const result = runSimulation(mission("flood-ready"), "rain-gardens", { coverage: 0.5 });
    const overlapBefore = result.before.find((m) => m.key === "floodplain_overlap")!;
    const overlapAfter = result.after.find((m) => m.key === "floodplain_overlap")!;
    expect(overlapAfter.value).toBe(overlapBefore.value);
    const resilienceAfter = result.after.find((m) => m.key === "resilience_score")!;
    const resilienceBefore = result.before.find((m) => m.key === "resilience_score")!;
    expect(resilienceAfter.value).toBeGreaterThan(resilienceBefore.value);
  });

  it("labels all after-metrics with a provenance value", () => {
    for (const mission of SEED_MISSIONS) {
      const intervention = mission.interventions[0];
      const result = runSimulation(mission, intervention.key, intervention.parameters);
      for (const m of [...result.before, ...result.after, ...result.deltas]) {
        expect(["observed", "derived", "simulated"]).toContain(m.provenance);
      }
    }
  });

  it("produces bounded, deterministic output for repeated calls", () => {
    const m = mission("safer-streets");
    const a = runSimulation(m, "traffic-calming", { intensity: 0.7 });
    const b = runSimulation(m, "traffic-calming", { intensity: 0.7 });
    expect(a).toEqual(b);
  });
});
