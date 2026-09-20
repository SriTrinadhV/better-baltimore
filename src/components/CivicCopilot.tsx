import { useMemo, useState } from "react";
import type { DataSource, Mission, SimulationResult } from "../app/types";
import { buildCorpus, type Chunk } from "../ai/corpus";
import { answerQuestion, type CopilotAnswer } from "../ai/explain";

interface Props {
  missions: Mission[];
  dataSources: DataSource[];
  simulationResults: Record<string, SimulationResult>;
}

const SUGGESTED_QUESTIONS = [
  "Why is Cool the Block here?",
  "What does the vacant building data measure?",
  "What assumptions does the flood simulation use?",
];

export function CivicCopilot({ missions, dataSources, simulationResults }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<CopilotAnswer | null>(null);

  const corpus = useMemo(
    () => buildCorpus(missions, dataSources, simulationResults),
    [missions, dataSources, simulationResults],
  );

  async function ask(question: string) {
    setQuery(question);
    setLoading(true);
    try {
      const result = await answerQuestion(question, corpus);
      setAnswer(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="copilot-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Civic Copilot"
      >
        Civic Copilot
      </button>
      {open && (
        <div className="copilot-panel" role="dialog" aria-label="Civic Copilot">
          <div className="copilot-panel__header">
            <span>Civic Copilot</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">
              &times;
            </button>
          </div>
          <p className="copilot-panel__hint">
            Ask about a mission's evidence, sources, or simulation assumptions. Answers are grounded in this
            app's own data — never invented.
          </p>
          <div className="copilot-panel__suggestions">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} type="button" className="copilot-panel__suggestion" onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) ask(query.trim());
            }}
          >
            <input
              className="copilot-panel__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question…"
            />
          </form>
          {loading && <p className="copilot-panel__hint">Retrieving evidence…</p>}
          {answer && !loading && <AnswerView answer={answer} />}
        </div>
      )}
    </>
  );
}

function AnswerView({ answer }: { answer: CopilotAnswer }) {
  if (answer.chunks.length === 0) {
    return <p className="copilot-panel__hint">No matching evidence found. Try a different question.</p>;
  }

  return (
    <div className="copilot-panel__answer">
      <span className="badge badge--confidence-illustrative">
        {answer.mode === "generated" ? "Gemini-generated summary" : "Evidence Explorer (no LLM)"}
      </span>
      {answer.text && <p>{answer.text}</p>}
      <ul className="copilot-panel__evidence">
        {answer.chunks.map((chunk: Chunk) => (
          <li key={chunk.id}>
            <strong>{chunk.title}</strong>
            <p>{chunk.text}</p>
            {chunk.url && (
              <a href={chunk.url} target="_blank" rel="noreferrer">
                {chunk.url}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
