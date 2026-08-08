# How it works

Three subsystems cooperate: the **simulation engine**, the **3D renderer**, and
the **code panel**. They share one contract — the `SimFrame`.

---

## 1. The simulation engine (`app/simulation.ts`)

### The frame contract

```ts
type CubeItem = { id: string; label: string; value?: number; slot?: number };

type SimFrame = {
  items:    CubeItem[];              // every cube present in this frame, in slot order
  active:   string[];                // ids highlighted amber and lifted
  settled:  string[];                // ids that are final (green)
  dimmed:   string[];                // ids ruled out (shrunk, dark, translucent)
  message:  string;                  // headline in the scene caption
  detail:   string;                  // sub-line in the caption / step inspector
  codeKey:  string;                  // which highlight group to light up
  phase:    string;                  // short label, e.g. "Compare", "Narrow"
  pointers?: Record<string, string>; // e.g. { low, mid, high }
  frontier?: string[];               // queue/stack/call-stack contents
  visited?:  string[];
  distances?: Record<string, number>;
};
```

`snapshot(items, message, detail, codeKey, phase, active, settled, dimmed, extra)`
builds one frame and **copies** `items` and the three id arrays. That copy is
what makes in-place mutation safe inside the builders.

### Input parsing

`parseInput(raw)` splits on `|`:

```
"2, 5, 8, 12, 16, 23, 38 | 23"
  └── left ───────────────┘ └ right
```

- `values` — the left side split on commas, `Number`-coerced, non-finite values
  dropped, **capped at 9 items**.
- `target` — `Number(right)`.
- `start` — first character of the left side, upper-cased (graph algorithms).
- `end` — first character of the right side, upper-cased.

Every builder falls back to a sensible default array when parsing yields
nothing, so a half-typed input never produces an empty scene.

### Dispatch

`buildSimulation(algorithm, raw, variant)` dispatches by `algorithm.id` for the
six array algorithms, then by `algorithm.structure` for the rest:

| Match | Builder |
| --- | --- |
| `linear-search` | `linearTrace` |
| `binary-search` | `binaryTrace` |
| `bubble-sort` | `bubbleTrace` |
| `insertion-sort` | `insertionTrace` |
| `merge-sort` | `mergeTrace` |
| `quick-sort` | `quickTrace` |
| `structure === "tree"` | `treeTrace` |
| `structure === "graph"` | `graphTrace` (delegates to `dijkstraTrace`) |
| otherwise | `recursionTrace` (delegates to `fibonacciTrace`) |

### What each builder emits

- **Linear search** — one `compare` frame per index carrying `pointers.cursor`
  (the `if` comparison), then either a `match` frame or an `advance` frame (back
  to the loop line) that pushes the index onto the ruled-out (dimmed) list.
- **Binary search** — a `probe` frame carrying `pointers.low/mid/high` and
  dimming everything outside `[low, high]`, then a `discard` frame after the
  interval narrows.
- **Bubble sort** — `compare` for every adjacent pair, `swap` when inverted
  (the working array is mutated so the cubes physically trade slots), and a
  `pass` frame that marks the suffix settled.
- **Insertion sort** — `select` lifts the key, `shift` for each larger element,
  then a `splice`-based `insert` and a growing settled prefix.
- **Merge sort** — recursive `split` frames, `compare` frames for each merge
  decision, and a `merge` frame after `items.splice(start, end - start, ...merged)`
  writes the ordered run back into the shared array.
- **Quick sort** — Lomuto partitioning: `pivot`, per-element `compare`,
  `partition` on a swap, then `recurse` when the pivot lands in its final slot
  (marked settled immediately, because it is).
- **Tree** — the tree is an **implicit array heap**: the child of slot `i` lives
  at `2i+1` and `2i+2`. `tree-traversals` walks pre/in/post order based on the
  variant; `bst-operations` follows the comparison path down from the root.
- **Graph** — a fixed 6-node graph. BFS `shift()`s the frontier, DFS `pop()`s it
  and reverses the neighbour order so the visual order reads naturally. Each
  frame carries the live `frontier` and `visited` arrays.
- **Dijkstra** — repeatedly settles the closest unsettled node, then emits a
  `relax` frame per outgoing edge plus an extra frame whenever a distance
  actually improves. `distances` rides along on every frame.
- **Recursion** — factorial pushes a `f(n)` cube per call down to the base case,
  then unwinds multiplying as it pops. Fibonacci expands an explicit call list
  and is **capped at 16 frames** so the exponential tree stays watchable.

### The fixed graph

```ts
graphEdges = [
  ["A","B",4], ["A","C",2], ["B","D",5], ["B","E",3],
  ["C","D",1], ["C","E",6], ["D","F",4], ["E","F",2],
];
```

Undirected — `adjacency` is built by inserting each edge in both directions.
Graph inputs only choose the **start** node; the `end` value parsed from
`"A | F"` is not used to terminate Dijkstra, which settles every reachable node.

---

## 2. The 3D renderer (`app/CubeScene.tsx`)

### One-time scene setup

An effect with an empty dependency array builds:

- a `PerspectiveCamera` (40° FOV) at `(0, 4.6, 9.3)`,
- a `WebGLRenderer` with antialiasing, PCF soft shadows, sRGB output, and ACES
  filmic tone mapping — wrapped in `try/catch` so a machine without WebGL gets
  a `.webgl-fallback` message instead of a crash (the step trace still works),
- a `HemisphereLight`, a shadow-casting `SpotLight`, and a purple rim
  `PointLight`,
- a matte floor plane and a `GridHelper` at `y = -2.5`,
- `OrbitControls` with damping, panning disabled, distance clamped to 6–14, and
  polar angle capped so you cannot orbit under the floor,
- a `ResizeObserver` that keeps the camera aspect and drawing buffer in sync.

The cleanup function cancels the animation frame, disconnects the observer, and
disposes controls, renderer, and every geometry/material in the scene.

### Per-frame reconciliation

A second effect runs on `[algorithm, frame]` and performs a keyed diff:

1. Rebuild link lines (graph edges, or tree parent→child segments).
2. Remove and dispose any cube whose id is no longer in `frame.items`.
3. For each item: create the cube if new (entering from 2 units below so it
   rises into place), refresh its label texture if the label changed, then set
   `target`, `targetScale`, and `targetColor`.

Nothing is positioned directly. The render loop interpolates:

```ts
cube.group.position.lerp(cube.target, .115);
cube.group.scale.lerp(cube.targetScale, .13);
cube.body.material.color.lerp(cube.targetColor, .12);
cube.body.material.emissive.lerp(cube.targetColor, .06);
```

Active cubes also spin slowly (`rotation.y += .012`) while playback is running,
and damp back to rest when paused.

### Layout per structure

| Structure | Placement |
| --- | --- |
| `array` | A single row on the X axis, centred: `(index - (count-1)/2) * 1.16` |
| `tree` | Level `floor(log2(slot+1))`; width halves each level from `6.6`; Y drops `1.65` per level |
| `graph` | Fixed hand-tuned coordinates in `graphPositions` (A–F) |
| `recursion` | A rising, receding stack: `y = -1.9 + index * 0.9`, `z = -index * 0.16` |

### State colours

All scene colours come from the active theme's `ScenePalette` (`app/themes.ts`),
passed into `CubeScene` as a prop; changing the theme rebuilds the scene.
Tokyo Night defaults:

| State | Palette key | Tokyo Night | Extra |
| --- | --- | --- | --- |
| Active | `active` | `0xe0af68` (yellow) | scale ×1.15, lifted `+0.55` on Y, rotating |
| Settled | `settled` | `0x9ece6a` (green) | — |
| Dimmed | `dimmed` | `0x292e42` | scale ×0.78, `opacity 0.38`, transparent |
| Default | `pending` | `0x7aa2f7` (blue) | — |

### Label textures and the cube cache

Labels are 256×128 canvases turned into `CanvasTexture`s — cheap, and no font
loading. Regenerating them every frame would leak GPU memory, so
`app/cubeCache.ts` provides:

```ts
cubeVisualSignature({ id, label }) // → `${id}\u0000${label}`
```

The NUL separator keeps ids and labels unambiguous, so `{id:"a", label:"bc"}`
can never collide with `{id:"ab", label:"c"}`.

`refreshCubeLabel` compares the stored signature with the new one and returns
early when they match; otherwise it disposes the old texture and draws a new
one. This is what makes editing the input string update the labels correctly
instead of showing stale numbers — the behaviour covered by
`tests/cube-cache.test.mjs`.

---

## 3. The code panel

### One curated source of truth

Every algorithm is hand-annotated in all four languages. Samples live in
category modules under `app/code/` — `search.ts`, `sorting.ts`, `trees.ts`,
`graphs.ts`, `recursion.ts` — as readable, properly formatted source with
inline markers:

```
§setup§function binarySearch(values: number[], target: number): number {
§setup§  let low = 0;
§setup§  let high = values.length - 1;
  while (low <= high) {
§probe§    const middle = Math.floor((low + high) / 2);
```

`compileSample()` (`app/code/sample.ts`) strips each `§key,key§` prefix,
preserves the leading indentation, and records the 1-based line number under
every key it names. The result is a `CodeSample { code, highlights }` where
`highlights` maps a `codeKey` to the exact lines to light up.
`app/codeSamples.ts` merges the category modules and compiles them once at
module load.

The samples are written to mirror the trace builders line for line — the DFS
sample includes the neighbour reversal the simulation performs, tree traversal
emits distinct `visit-pre` / `visit-in` / `visit-post` keys so each variant
highlights its own emit line, and Dijkstra separates `relax` (computing a
candidate distance) from `update` (an improvement actually written).

### Highlight lookup

```ts
const activeLines = sample.highlights[current.codeKey] ?? sample.highlights.setup ?? [1];
```

The frame's `codeKey` is the join between the two systems: `simulation.ts`
labels each frame (`"compare"`, `"discard"`, `"relax"`…), and the sample
provides the lines for that label. A missing key degrades to the `setup` lines,
then to line 1 — but `tests/code-sync.test.mjs` fails the build of any frame
whose `codeKey` has no explicit lines, so the fallback should never fire in
practice.

### Tokenizing (`app/SyntaxCode.tsx`)

A single regex walks each line and classifies matches into
`comment | string | number | keyword | type | function | plain | operator`:

- keyword sets are per-language (TypeScript, Python, Go, Java each get their own),
- an identifier followed by `(` becomes `function`,
- an identifier starting with a capital, or present in the shared `types` set,
  becomes `type`.

Each token is emitted as `<span className="tok-…">`, and lines whose number is
in `activeLines` get `.active` — a yellow left border and a gradient wash.

---

## 4. What the user sees tie back to

| UI element | Source |
| --- | --- |
| Scene caption (phase / message / detail) | `frame.phase`, `frame.message`, `frame.detail` |
| `NN / NN` counter and progress bar | `safeStep`, `trace.length` |
| POINTERS row | `Object.keys(frame.pointers)` |
| FRONTIER row | `frame.frontier` (queue, stack, or call stack) |
| VISITED row | `frame.visited` |
| INVARIANT row | `algorithm.insight` (static per algorithm) |
| TIME / SPACE badges | `algorithm.time` / `algorithm.space` |
| Code filename | `algorithm.id` with `-` → `_`, plus a per-language extension |
