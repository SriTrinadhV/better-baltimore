import type { DataSource } from "../app/types";

export function findSource(sources: DataSource[], id: string | null): DataSource | null {
  if (!id) return null;
  return sources.find((s) => s.id === id) ?? null;
}
