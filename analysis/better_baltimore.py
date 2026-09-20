import marimo

__generated_with = "0.24.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import json
    from pathlib import Path

    import altair as alt
    import marimo as mo
    import pandas as pd

    DATA_DIR = Path(__file__).resolve().parent.parent / "public" / "data"
    return DATA_DIR, alt, json, mo, pd


@app.cell
def _(mo):
    mo.md(
        """
        # Better Baltimore — Data Command Center

        Baltimore City publishes rich open civic data, but most residents never
        explore it directly. This notebook explores the **same normalized data
        and analytical logic** that power the 3D Better Baltimore experience:
        real Baltimore City datasets identify problem hotspots, and a
        deterministic scenario model estimates the effect of a hypothetical
        intervention.

        Every value below is labeled **observed** (from the raw dataset),
        **derived** (our calculation from observed data), or **simulated**
        (a hypothetical outcome from the intervention control).
        """
    )
    return


@app.cell
def _(DATA_DIR, json):
    sources = json.loads((DATA_DIR / "sources.json").read_text())
    hotspots = json.loads((DATA_DIR / "hotspots.json").read_text())
    sources_by_id = {s["id"]: s for s in sources}
    return hotspots, sources, sources_by_id


@app.cell
def _(mo, sources):
    dataset_dropdown = mo.ui.dropdown(
        options={s["name"]: s["id"] for s in sources},
        value=sources[0]["name"],
        label="Dataset",
    )
    return (dataset_dropdown,)


@app.cell
def _(mo):
    mo.md("## Where is the problem?").left()
    return


@app.cell
def _(dataset_dropdown, mo):
    dataset_dropdown
    return


@app.cell
def _(dataset_dropdown, mo, sources_by_id):
    _source = sources_by_id[dataset_dropdown.value]
    mo.md(
        f"""
        **{_source['name']}** — published by {_source['publisher']}, retrieved {_source['retrievedAt']}.

        - **Observed:** {_source['observed']}
        - **Derived:** {_source['derived']}
        - **Simulated:** {_source['simulated']}
        - Source: [{_source['url']}]({_source['url']})
        """
    )
    return


@app.cell
def _():
    mission_by_source = {
        "tree-canopy": "cool-the-block",
        "vacant-buildings": "reclaim-the-lot",
        "floodplain": "flood-ready",
    }
    overlay_file_by_source = {
        "tree-canopy": "tree_canopy_hotspot.geojson",
        "vacant-buildings": "vacant_hotspot.geojson",
        "floodplain": "floodplain_hotspot.geojson",
    }
    return mission_by_source, overlay_file_by_source


@app.cell
def _(dataset_dropdown, mission_by_source):
    mission_id = mission_by_source[dataset_dropdown.value]
    return (mission_id,)


@app.cell
def _(DATA_DIR, dataset_dropdown, json, overlay_file_by_source):
    overlay_path = DATA_DIR / overlay_file_by_source[dataset_dropdown.value]
    overlay_geojson = json.loads(overlay_path.read_text()) if overlay_path.exists() else {"features": []}
    return (overlay_geojson,)


@app.cell
def _(alt, hotspots, mission_id, overlay_geojson):
    _hotspot = hotspots[mission_id]
    _geom_type = (
        overlay_geojson["features"][0]["geometry"]["type"] if overlay_geojson.get("features") else "Point"
    )

    if _geom_type == "Point":
        _rows = [
            {"lng": f["geometry"]["coordinates"][0], "lat": f["geometry"]["coordinates"][1]}
            for f in overlay_geojson["features"]
        ]
        map_chart = (
            alt.Chart(alt.Data(values=_rows))
            .mark_circle(color="#e8590c", opacity=0.6, size=20)
            .encode(longitude="lng:Q", latitude="lat:Q")
            .properties(width=520, height=420, title=f"Hotspot cell near ({_hotspot['lat']}, {_hotspot['lng']})")
        )
    else:
        map_chart = (
            alt.Chart(alt.Data(values=overlay_geojson["features"]))
            .mark_geoshape(fill="#2f9e44", stroke="white", opacity=0.6)
            .properties(width=520, height=420, title=f"Hotspot cell near ({_hotspot['lat']}, {_hotspot['lng']})")
        )
    map_chart
    return


@app.cell
def _(hotspots, mission_id, mo):
    _hotspot = hotspots[mission_id]
    mo.md(
        f"""
        ## What does the data show?

        **Why this location?** {_hotspot['method']}

        Grid cell: row {_hotspot['gridCell']['row']}, column {_hotspot['gridCell']['col']}
        &nbsp;·&nbsp; center ({_hotspot['lat']}, {_hotspot['lng']})
        """
    )
    return


@app.cell
def _(hotspots, mission_id, pd):
    _metrics = hotspots[mission_id]["metrics"]
    baseline_df = pd.DataFrame({"metric": list(_metrics.keys()), "value": list(_metrics.values())})
    return (baseline_df,)


@app.cell
def _(alt, baseline_df, mo):
    mo.md("### Observed / derived baseline metrics")
    _chart = (
        alt.Chart(baseline_df)
        .mark_bar(color="#4c9aff")
        .encode(x="metric:N", y="value:Q", tooltip=["metric", "value"])
        .properties(width=400, height=240)
    )
    _chart
    return


@app.cell
def _(mo):
    mo.md("## What if we intervene?")
    return


@app.cell
def _(mission_id, mo):
    _label = {
        "cool-the-block": "Intervention intensity",
        "reclaim-the-lot": "Parcels reused",
        "flood-ready": "Green-infrastructure coverage",
    }[mission_id]
    _default = {"cool-the-block": 0.5, "reclaim-the-lot": 4, "flood-ready": 0.3}[mission_id]
    _max = {"cool-the-block": 1.0, "reclaim-the-lot": 20, "flood-ready": 1.0}[mission_id]
    _step = {"cool-the-block": 0.05, "reclaim-the-lot": 1, "flood-ready": 0.05}[mission_id]
    intensity_slider = mo.ui.slider(start=0, stop=_max, step=_step, value=_default, label=_label)
    return (intensity_slider,)


@app.cell
def _(intensity_slider):
    intensity_slider
    return


@app.cell
def _():
    def simulate(mission_id: str, metrics: dict, intensity: float) -> dict:
        """Mirrors the deterministic formulas in src/simulation/engine.ts so
        the notebook and the 3D game tell the same quantitative story."""
        after = dict(metrics)
        if mission_id == "cool-the-block":
            after["canopy_pct"] = min(100, metrics["canopy_pct"] + intensity * 20)
            after["green_score"] = min(100, metrics["green_score"] + intensity * 25)
        elif mission_id == "reclaim-the-lot":
            parcels = max(0, round(intensity))
            remaining = max(0, metrics["vacant_count"] - parcels)
            reuse_share = (
                (metrics["vacant_count"] - remaining) / metrics["vacant_count"] if metrics["vacant_count"] else 0
            )
            after["vacant_count"] = remaining
            after["vacancy_density"] = max(0, metrics["vacancy_density"] * (1 - reuse_share))
        elif mission_id == "flood-ready":
            after["resilience_score"] = min(100, metrics["resilience_score"] + intensity * 50)
            # floodplain_overlap is observed official geography — unchanged by the scenario.
        return after

    return (simulate,)


@app.cell
def _(hotspots, intensity_slider, mission_id, pd, simulate):
    _metrics = hotspots[mission_id]["metrics"]
    _after = simulate(mission_id, _metrics, intensity_slider.value)
    before_after_df = pd.concat(
        [
            pd.DataFrame({"metric": _metrics.keys(), "value": _metrics.values(), "stage": "before"}),
            pd.DataFrame({"metric": _after.keys(), "value": _after.values(), "stage": "after"}),
        ]
    )
    return (before_after_df,)


@app.cell
def _(alt, before_after_df, mo):
    mo.md("### Before / after (simulation estimate)")
    _chart = (
        alt.Chart(before_after_df)
        .mark_bar()
        .encode(
            x="stage:N",
            y="value:Q",
            color=alt.Color("stage:N", scale=alt.Scale(domain=["before", "after"], range=["#9aa7b5", "#4c9aff"])),
            column="metric:N",
            tooltip=["metric", "stage", "value"],
        )
        .properties(width=150, height=240)
    )
    _chart
    return


@app.cell
def _(mo):
    mo.md(
        """
        ## What are the assumptions?

        - Mission hotspots are derived by scanning a citywide grid and scoring
          each cell against the dataset's own metric (lowest tree-canopy
          coverage, highest vacant-building count, highest floodplain
          overlap) — see `docs/DATA_SOURCES.md` for the exact method and
          source URLs.
        - The intervention slider drives the same deterministic formulas used
          in the 3D game's simulation engine (`src/simulation/engine.ts`).
          No LLM computes or alters these numbers.
        - "After" values are simulation estimates, not measurements or an
          official city forecast.
        """
    )
    return


if __name__ == "__main__":
    app.run()
