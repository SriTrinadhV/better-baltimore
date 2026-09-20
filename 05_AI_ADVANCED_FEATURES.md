# Better Baltimore — Advanced Concepts Without Sacrificing Completion

The project can demonstrate advanced architecture, but advanced features are valuable only if the core remains stable.

## Rule
Implement **one advanced AI feature well** before adding another.

---

# A. Civic Copilot — RAG-lite (P1)
This is the best AI addition for the 12-hour version.

## User questions
- Why is this mission here?
- What does this dataset actually measure?
- Which part is real data and which part is simulated?
- Why might this intervention help?
- What assumptions does the model use?

## Retrieval corpus
Build from:
- dataset metadata,
- source descriptions,
- mission evidence,
- baseline metrics,
- intervention descriptions,
- simulation assumptions,
- optionally short official city-document excerpts.

Each chunk:
```json
{
  "id": "...",
  "missionId": "...",
  "sourceId": "...",
  "title": "...",
  "text": "...",
  "url": "..."
}
```

## Retrieval
For this small corpus:
- normalize query,
- tokenize,
- score exact terms + TF-IDF/BM25-style relevance,
- return top 3–5 chunks.

Do NOT spend hackathon time deploying a vector database unless everything else is finished.

## Generation
If Gemini API key is available:
- provide only retrieved evidence,
- force concise answer,
- require it to identify observed/derived/simulated facts,
- require citations/source names,
- prohibit inventing metrics.

Fallback:
- show retrieved evidence cards without LLM generation.

This means the feature still works without an API key.

---

# B. Data-to-Mission pipeline (P1/P2)
The system should demonstrate that missions can be created from data rather than hand-placed.

Pipeline:
```text
source GeoJSON
  -> clean
  -> spatial aggregation
  -> normalized score
  -> top hotspot
  -> mission candidate
  -> deterministic evidence package
  -> optional LLM narrative
```

LLM job:
- rewrite a structured evidence package into understandable mission text.

LLM must NOT:
- choose numerical outputs,
- invent a hotspot,
- fabricate a source.

---

# C. Explainable simulation (P1)
Instead of a black-box score, every simulation outputs assumptions.

Example:
```json
{
  "result": {
    "scenarioScoreBefore": 32,
    "scenarioScoreAfter": 51
  },
  "assumptions": [
    "Scenario score is normalized from the mission baseline and selected intervention intensity.",
    "This is not a city forecast."
  ]
}
```

Civic Copilot can explain this to the player.

This is more valuable than using an LLM to generate random game content.

---

# D. City Memory extraction agent (P2)
Long-term idea:
- ingest reliable Baltimore event/news sources,
- extract event name/date/location/category,
- de-duplicate,
- match location,
- create a draft City Memory.

12-hour safe version:
- manually choose one public event,
- store source URL,
- optionally have an LLM convert the source notes into a structured draft,
- human/Claude verifies before seeding.

Do not create an automated “live news -> playable mission” system during the MVP unless everything is already green.

---

# E. “What if?” scenario agent (P2)
User asks:
> What if Baltimore planted twice as many trees in this mission area?

Architecture:
1. parse user intent,
2. map it to an allowed simulation parameter,
3. clamp value,
4. run deterministic simulation,
5. have LLM explain the result.

Important:
The agent does not invent the math.

---

# F. Multi-agent architecture (Roadmap only unless ahead)
Possible future agents:
- Data Scout: locates relevant city datasets.
- Evidence Agent: validates source metadata.
- Hotspot Agent: proposes analytical target.
- Scenario Agent: maps intervention to allowed simulation parameters.
- Narrative Agent: explains findings.
- Memory Agent: extracts cultural events.

For the hackathon, these should be functions/modules, not an elaborate agent framework.
Do not install LangGraph just to say the project uses agents.

---

# G. Embeddings/vector search (Roadmap/P2)
Useful if the corpus grows to:
- planning documents,
- zoning documents,
- climate plans,
- public meeting minutes,
- event archives.

For the 12-hour version, lexical retrieval is enough.

If embeddings are added:
- use a small local index,
- store source ID and chunk metadata,
- preserve exact citations.

---

# H. Geospatial analytics
This project should look advanced even without ML.

Useful concepts:
- spatial binning,
- point-in-polygon,
- polygon intersection,
- area-weighted metrics,
- proximity/radius queries,
- hotspot ranking,
- normalization,
- multi-factor scoring,
- GeoJSON simplification.

Prefer transparent geospatial analysis over an unjustified ML model.

---

# I. Clustering / anomaly detection (P2)
Could be used for 311:
- DBSCAN/HDBSCAN for issue clusters,
- k-means only if spatial assumptions are acceptable,
- z-score/IQR anomaly detection for unusually high issue density.

Not required for submission.

---

# J. Time-series analysis (P2)
For 311 or events:
- hour/day/week trends,
- recent vs historical baseline,
- rolling average,
- seasonality.

This can produce compelling marimo charts if the source is available.

---

# K. Parking intelligence future architecture
Preserve the user's parking concept as a mission/roadmap:

Long-term inputs:
- public camera vehicle counts,
- garage occupancy APIs,
- historic demand,
- events,
- parking rules/signage,
- walking distance,
- ETA.

Long-term output:
- probability of legal parking at ETA,
- alternate underused parking 5–10 minutes away,
- demand redistribution.

Important:
- Street View/360 can help identify static signs/restrictions, not live occupancy.
- Satellite imagery cannot be treated as live parking availability.
- never claim “guaranteed spot” without authoritative live capacity.

---

# L. Digital-twin direction
Long-term Better Baltimore can become:
- persistent city state,
- multiple real-time data feeds,
- collaborative scenario planning,
- versioned interventions,
- time travel through city states,
- community proposal comparison.

SpacetimeDB is well suited to persistent shared scenario state.

---

# M. Advanced concepts to mention in the demo only if actually implemented
- reactive database subscriptions,
- event-driven state,
- geospatial ETL,
- explainable simulation,
- provenance tracking,
- retrieval-augmented explanations,
- multi-client synchronization,
- deterministic scenario modeling,
- interactive notebook analytics,
- 3D geospatial visualization.

Do not claim:
- “AI predicts Baltimore's future”
- “digital twin” in an engineering-grade sense
- “real-time city” unless using real-time feeds
- “ML model” if the project only uses weighted formulas
