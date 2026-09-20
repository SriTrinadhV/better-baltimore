import type { Chunk } from "./corpus";

/**
 * Simple lexical retrieval over a small in-memory corpus: term-frequency
 * overlap between the query and each chunk's title+text, with a small boost
 * for title matches. No embeddings/vector DB — appropriate for a corpus of
 * a few dozen chunks (see 05_AI_ADVANCED_FEATURES.md).
 */
export function retrieve(corpus: Chunk[], query: string, topN = 4): Chunk[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scored = corpus
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTerms) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN).map((s) => s.chunk);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function scoreChunk(chunk: Chunk, queryTerms: string[]): number {
  const titleTerms = tokenize(chunk.title);
  const bodyTerms = tokenize(chunk.text);
  let score = 0;
  for (const term of queryTerms) {
    score += titleTerms.filter((t) => t === term).length * 3;
    score += bodyTerms.filter((t) => t === term).length;
  }
  return score;
}
