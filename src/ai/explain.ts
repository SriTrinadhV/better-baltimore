import type { Chunk } from "./corpus";
import { retrieve } from "./retrieve";

export interface CopilotAnswer {
  mode: "evidence" | "generated";
  chunks: Chunk[];
  text?: string;
}

/**
 * Answers a Civic Copilot question by retrieving relevant evidence chunks.
 * If VITE_GEMINI_API_KEY is set, asks Gemini to summarize the retrieved
 * evidence (never to invent numbers). Otherwise — the default in this
 * environment — falls back to returning the evidence chunks directly, which
 * is a fully valid, complete answer per the product spec: "the feature
 * still works without an API key."
 *
 * Note: calling Gemini directly from the browser embeds the API key in the
 * client bundle. That's an acceptable hackathon-demo shortcut with a
 * restricted/throwaway key, not a pattern for production — a real deployment
 * should proxy this through a backend.
 */
export async function answerQuestion(query: string, corpus: Chunk[]): Promise<CopilotAnswer> {
  const chunks = retrieve(corpus, query, 4);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (apiKey && chunks.length > 0) {
    try {
      const text = await callGemini(apiKey, query, chunks);
      return { mode: "generated", chunks, text };
    } catch (err) {
      console.error("Gemini generation failed, falling back to evidence", err);
    }
  }

  return { mode: "evidence", chunks };
}

async function callGemini(apiKey: string, query: string, chunks: Chunk[]): Promise<string> {
  const evidence = chunks.map((c) => `- ${c.title}: ${c.text}`).join("\n");
  const prompt =
    "You are the Better Baltimore Civic Copilot. Answer the question using ONLY the evidence below. " +
    "Explicitly say which facts are observed, derived, or simulated. Cite evidence titles. " +
    "Never invent a number that is not in the evidence.\n\n" +
    `Evidence:\n${evidence}\n\nQuestion: ${query}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text");
  return text;
}
