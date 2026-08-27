# State Survey Map

A clickable US map for collecting survey data: define your own categories, "paint"
states into them, and submit. Each submission is appended to a local data file in a
shape that's easy to load into pandas (or any JSON-aware tool) once you've collected
enough responses to analyze.

## Stack

- **client/** — React + TypeScript + Vite. The map is rendered directly from
  [`us-atlas`](https://github.com/topojson/us-atlas) TopoJSON (real US Census
  boundary data, pre-projected with Albers USA) via `d3-geo` + `topojson-client` —
  no image maps, no hand-traced SVG paths, so every state is a real clickable shape.
  Categories persist across submissions via `localStorage` on the visitor's browser.
- **server/** — Express. One route to accept a submission, one to report how many
  have been collected. Storage is a plain newline-delimited JSON file
  (`data/submissions.jsonl`) — no database to install for a local-first tool like this.

The `assets/wireframe-map-of-united-states.png` you provided isn't used — a flat PNG
can't be split into per-state click targets without a fragile pixel-coordinate image
map, so the real vector boundary data above is used instead.

## Running it locally

Requires Node 18+.

```bash
npm run install:all   # installs client, server, and root dev-tooling deps
npm run dev            # runs both the API (:3001) and the client (:5173)
```

Then open **http://localhost:5173**. The client proxies `/api/*` to the Express
server automatically (see `client/vite.config.ts`), so you only need the one URL.

Stop with Ctrl+C. Each half can also be run on its own from `client/` or `server/`
with `npm run dev`.

## Using the app

1. Optionally give the entry a name at the top of the sidebar — if you leave it
   blank, the submission is saved under its auto-generated id instead.
2. Add one or more categories (name + color; color is editable via the swatch at
   any time).
3. Click a category row to make it the active "paint" tool, then click states on the
   map to assign them to it. Clicking a state again with the same category toggles
   it back off. A state can hold more than one category at once — it renders as a
   diagonal-striped blend of every color assigned to it.
4. The **Eraser** row wipes all of a state's categories in one click.
5. **Clear map** resets every state to unassigned without submitting.
6. **Submit entry** posts the current name + categories + assignments as one data
   record, then clears the map and the name field (categories stay put for the next
   entry).

Washington DC is rendered as a fixed-size circle over its centroid rather than its
true (tiny) shape, since its real land area is only a few pixels across at this map's
scale — otherwise it'd be nearly unclickable.

## Data format

Every submission is one JSON object, appended as a line to `data/submissions.jsonl`.
`assignments` maps each state to an **array** of category ids, since a state can now
belong to more than one category:

```json
{
  "id": "b3b0c6b2-...",
  "name": "Alex's picks",
  "submittedAt": "2026-08-27T18:42:11.104Z",
  "categories": [
    { "id": "3f1e...", "name": "Been There", "color": "#e63946" },
    { "id": "9a2c...", "name": "Want to Go", "color": "#f4a261" }
  ],
  "assignments": {
    "California": ["3f1e...", "9a2c..."],
    "Texas": ["3f1e..."],
    "Colorado": ["9a2c..."]
  }
}
```

Categories are captured **per submission** (not a shared global list), since each
visitor defines their own — that's what makes later analysis able to distinguish, say,
one respondent's "Been There" from another's differently-colored "Been There". States
absent from `assignments` were left unassigned. `name` falls back to the same value as
`id` when the visitor leaves it blank, so it's never empty in the data.
`data/submissions.jsonl` is git-ignored by default since it's collected data, not code.

### Loading it for analysis

JSON Lines loads directly with pandas:

```python
import pandas as pd

subs = pd.read_json("data/submissions.jsonl", lines=True)

# Long format: one row per (submission, state, category), with category details joined in.
rows = []
for _, sub in subs.iterrows():
    cat_by_id = {c["id"]: c for c in sub["categories"]}
    for state, cat_ids in sub["assignments"].items():
        for cat_id in cat_ids:
            cat = cat_by_id.get(cat_id, {})
            rows.append({
                "submission_id": sub["id"],
                "entry_name": sub["name"],
                "submitted_at": sub["submittedAt"],
                "state": state,
                "category_name": cat.get("name"),
                "category_color": cat.get("color"),
            })

long_df = pd.DataFrame(rows)
```

From `long_df` you can do the usual things: `value_counts()` on `state` per
`category_name`, pivot into a state-by-category matrix, feed it to a choropleth, etc.

## Project layout

```
client/   React app (map + category UI)
server/   Express API (accepts + stores submissions)
data/     submissions.jsonl lives here at runtime
```
