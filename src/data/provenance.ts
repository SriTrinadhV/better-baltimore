import type { DataSource } from "../app/types";

let cache: DataSource[] | null = null;

export async function loadDataSources(): Promise<DataSource[]> {
  if (cache) return cache;
  const res = await fetch("/data/sources.json");
  if (!res.ok) throw new Error(`Failed to load data sources: ${res.status}`);
  cache = (await res.json()) as DataSource[];
  return cache;
}

export function findSource(sources: DataSource[], id: string | null): DataSource | null {
  if (!id) return null;
  return sources.find((s) => s.id === id) ?? null;
}
