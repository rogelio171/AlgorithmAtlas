# Adding an algorithm

A new algorithm needs three things: a **catalog entry**, **code samples**, and a
**trace builder**. If it uses one of the four existing structures, you write no
Three.js code at all.

---

## Step 1 — Catalog entry (`app/algorithmData.ts`)

Append a `push` in the same compact style as its neighbours:

```ts
algorithms.push({
  id: "selection-sort", title: "Selection sort", category: "Sorting",
  difficulty: "Beginner", structure: "array" as StructureKind,
  summary: "Select the smallest remaining value and swap it forward.",
  insight: "The left prefix holds the k smallest values.",
  time: "O(n²)", space: "O(1)",
  defaultInput: "7, 3, 9, 2, 6",
  presets: [
    { label: "Mixed", value: "7, 3, 9, 2, 6" },
    { label: "Sorted", value: "1, 2, 3, 4, 5" },
    { label: "Reverse", value: "6, 5, 4, 3, 2" },
  ],
});
```

- `id` is the join key for everything downstream — keep it kebab-case.
- `category` must already exist in the `categories` tuple, or add it there too.
- `insight` renders as the INVARIANT line in the live-state panel.
- Add `variants: [...]` only if the trace builder actually branches on it.

## Step 2 — Code samples

### Option A (preferred) — curated, marker-annotated

Create `app/code/sorting.ts` (or extend an existing module) using the `§key§`
marker syntax:

```ts
import type { RawSamples } from "./sample";

export const sortingSamples: RawSamples = {
  "selection-sort": {
    typescript: `
§setup§function selectionSort(values: number[]): number[] {
§inspect§  for (let index = 0; index < values.length; index++) {
    let smallest = index;
§compare§    for (let scan = index + 1; scan < values.length; scan++) {
      if (values[scan] < values[smallest]) smallest = scan;
    }
§swap§    [values[index], values[smallest]] = [values[smallest], values[index]];
  }
§done§  return values;
}`,
    python: `...`,
    go: `...`,
    java: `...`,
  },
};
```

Rules:

- One marker per line, at the very start of the line's content (leading
  indentation is preserved, the marker is stripped).
- A marker may name several keys: `§compare,inspect§`.
- The keys must match the `codeKey` values your trace builder emits.
- All four languages are required — `RawSamples` is `Record<string, Record<Language, string>>`.

Then register the module in `app/codeSamples.ts`, merging it into the `search`
lookup (or a new one) that is checked before the fallback:

```ts
const curated = { ...searchSamples, ...sortingSamples };
```

### Option B — compact snippet + inference

Add `snippets["selection-sort"]` entries in `algorithmData.ts` for all four
languages. `getCodeSample` will format them and infer highlights from the regex
cue table. Faster to write, less precise highlighting. Add a cue pattern to the
`cues` map in `codeSamples.ts` if your builder emits a `codeKey` that has none.

## Step 3 — Trace builder (`app/simulation.ts`)

Write a function that returns `SimFrame[]`, using `snapshot()` for each frame:

```ts
function selectionTrace(raw: string) {
  const { values: given } = parseInput(raw);
  const items = numberItems(given.length ? given : [7, 3, 9, 2, 6]);
  const frames = [snapshot(items, "Begin with an unsorted row.",
    "Find the smallest value in the remaining range.", "setup", "Initialize")];

  for (let index = 0; index < items.length - 1; index++) {
    let smallest = index;
    for (let scan = index + 1; scan < items.length; scan++) {
      frames.push(snapshot(items,
        `Compare ${items[scan].label} with ${items[smallest].label}.`,
        "Track the smallest value seen so far.", "compare", "Compare",
        [items[scan].id, items[smallest].id],
        items.slice(0, index).map(item => item.id)));
      if ((items[scan].value ?? 0) < (items[smallest].value ?? 0)) smallest = scan;
    }
    [items[index], items[smallest]] = [items[smallest], items[index]];
    frames.push(snapshot(items, `${items[index].label} is placed.`,
      "The sorted prefix grows by one.", "swap", "Place",
      [items[index].id], items.slice(0, index + 1).map(item => item.id)));
  }

  frames.push(snapshot(items, "The row is sorted.", "Every cube is final.",
    "done", "Complete", [], items.map(item => item.id)));
  return frames;
}
```

Then dispatch it in `buildSimulation`:

```ts
if (algorithm.id === "selection-sort") return selectionTrace(raw);
```

### Trace-builder checklist

- [ ] The first frame is a `setup` frame that shows the initial state.
- [ ] The last frame is a `done` frame with everything relevant in `settled`.
- [ ] Cube `id`s are stable across frames — never renumber a cube mid-trace, or
      it will teleport instead of glide.
- [ ] Mutate your working `items` array freely; `snapshot()` copies it.
- [ ] Every `codeKey` you emit exists in the sample's `highlights`.
- [ ] Fall back to a default dataset when `parseInput` returns nothing.
- [ ] Keep the frame count reasonable — cap expensive expansions the way
      `fibonacciTrace` caps at 16.
- [ ] Populate `pointers` / `frontier` / `visited` / `distances` when they help;
      they drive the LIVE STATE panel for free.

## Step 4 — A new structure (only if needed)

Adding a fifth `StructureKind` (say `"matrix"`) means:

1. Extend the `StructureKind` union in `algorithmData.ts`.
2. Add a branch to `cubePosition()` in `CubeScene.tsx` returning a
   `THREE.Vector3` per item.
3. Add a branch to `rebuildLinks()` if the structure has visible connections.
4. Add a dispatch branch in `buildSimulation`.

Use `item.slot` (rather than array index) when the visual position should be
independent of ordering, the way the tree layout does.

## Step 5 — Verify

```bash
npm run lint
npm test
node --test tests/cube-cache.test.mjs
```

Then check by hand in `npm run dev`:

- the algorithm appears under its category tab and under `All`,
- all three presets load and rewind to step 0,
- every variant button changes the trace (or remove the variants),
- all four language tabs render, and the highlighted lines track the steps,
- editing the input updates the cube labels immediately,
- scrubbing backwards and forwards produces coherent frames,
- the layout survives the 780px and 440px breakpoints.

If your addition is user-visible, update
[`algorithms.md`](./algorithms.md) and the catalog list in the root
[`README.md`](../README.md) — including the "13 algorithms" counts in
`app/AlgorithmLab.tsx`, `app/layout.tsx`, and `github-pages/index.html`.
