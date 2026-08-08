# How it works

Three subsystems cooperate: the **simulation engine**, the **2D stage**, and
the **code panel**. They share one contract — the `SimFrame`.

---

## 1. The simulation engine (`app/simulation.ts`)

### The frame contract

```ts
type CubeItem = {
  id: string; label: string; value?: number;
  slot?: number;                     // tree position (implicit heap index)
  lane?: number; col?: number;       // divide-and-conquer row / column
  badge?: string;                    // corner annotation (distance, visit order)
};

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
  path?:     string[];               // result path; its edges render highlighted
  lanes?:    number;                 // trace-wide lane count, for stable sizing
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
nothing, so a half-typed input never produces an empty stage.

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
- **Merge sort** — the runs physically separate. Each cube carries a `lane`
  (recursion depth) and a `col`; a `split` frame pushes both halves one lane
  deeper with a small gap between them, `base` calls out single-value runs, and
  merging is step-by-step: a `compare` frame for the two run fronts, then a
  `merge` frame as the winner is lifted back up into the parent lane. A final
  `merge` frame marks the whole run sorted before it is handed upward.
- **Quick sort** — Lomuto partitioning: `pivot`, per-element `compare`,
  `partition` on a swap, then `recurse` when the pivot lands in its final slot
  (marked settled immediately, because it is).
- **Tree** — the tree is an **implicit array heap**: the child of slot `i` lives
  at `2i+1` and `2i+2`. `tree-traversals` walks pre/in/post order based on the
  variant; `bst-operations` follows the comparison path down from the root.
- **Graph** — a fixed 6-node graph. BFS `shift()`s the frontier, DFS `pop()`s it
  and reverses the neighbour order so the visual order reads naturally. Each
  frame carries the live `frontier` and `visited` arrays.
- **Dijkstra** — answers a specific question: the shortest path from `start`
  to `end` (both come from the input, e.g. `A | F`). It settles the closest
  unsettled node, emits a `relax` frame per outgoing edge and an `update` frame
  whenever a distance improves, and records a predecessor for each improvement.
  Once the target settles it stops, then walks the predecessor chain backwards
  with one `path` frame per hop and ends on a `done` frame carrying the full
  path and its total distance. Every cube wears its current best distance as a
  badge, and `distances`/`path` ride along on the frames.
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
BFS and DFS use only the **start** node. Dijkstra uses both: `"A | F"` asks for
the shortest path from `A` to `F`, and the trace stops once `F` is settled.

---

## 2. The 2D stage (`app/CubeStage.tsx`)

The stage is plain DOM: one absolutely positioned `<div class="sim-cube">` per
cube, plus an `<svg>` for graph edges and tree branches. There is no canvas and
no WebGL — every colour comes from the theme's CSS tokens, and motion is driven
by `requestAnimationFrame` writing `transform`.

### A fixed logical stage

Everything is laid out in a **660×360 logical space**. A `ResizeObserver` scales
`.sim-inner` to fit whatever the panel is actually showing:

```ts
const scale = Math.min(stage.clientWidth / STAGE_W, stage.clientHeight / STAGE_H);
world.style.transform = `translate(-50%, -50%) scale(${scale})`;
```

So one set of coordinates works at every breakpoint, and nothing has to be
recomputed on resize.

### Layout per structure

| Structure | Placement |
| --- | --- |
| `array` | A centred row at `y = 190`, pitch `66` |
| `array` + lanes | Divide-and-conquer tree: row `y` from the trace-wide `lanes` count, `x` from `col` |
| `tree` | Level `floor(log2(slot+1))`; width halves each level from `560`; `y = 70 + level × 84` |
| `graph` | Fixed hand-tuned coordinates in `graphPositions` (A–F) |
| `recursion` | A stack growing upward from `y = 320`, pitch capped at `44` |

### The motion model

React renders the cube elements and then gets out of the way: a
`useLayoutEffect` compares each cube's **live** position against its new target
and animates the difference itself. Nothing re-renders mid-flight.

**Eased tweens.** Every move is a fixed 380 ms tween on `easeInOutCubic` —
accelerate, glide, decelerate, arrive. Unlike a per-frame `lerp`, it actually
finishes, and it is frame-rate independent.

**Arc swaps.** Before animating, the effect looks for pairs of cubes trading
places (each one's target is the other's current position). Those get opposing
vertical arcs — the right-mover passes over, the left-mover dips under — so two
cubes never slide through each other:

```ts
const over = -Math.min(46, 16 + span * .18), under = Math.min(24, 8 + span * .1);
```

Long single moves (over 100 units, e.g. a merge-sort splice) also get a gentle
arc so the eye can follow them.

**Squash & stretch.** Cubes stretch along their direction of travel and relax
back, peaking mid-flight via `Math.sin(Math.PI * k)`, then a short 150 ms
landing squash. The effect scales with distance, so a one-slot nudge stays
subtle:

```ts
record.sx = horizontal ? 1 + .2 * s * strength : 1 - .13 * s * strength;
```

**Entrances.** New cubes fade in and scale from 0.4 → 1 over 240 ms.

**Reduced motion.** `prefers-reduced-motion` is read once; when set, cubes jump
straight to their targets with no tween, arc, or squash.

Each cube's in-flight `requestAnimationFrame` handle is stored and cancelled
before a new animation starts, so rapid scrubbing never leaves two loops
fighting over the same element.

### State colours

All colours come from the active theme's CSS tokens — the stage itself has no
palette. Tokyo Night defaults:

| State | Token | Tokyo Night | Extra |
| --- | --- | --- | --- |
| Active | `--warn` | `#e0af68` (yellow) | lifted 24px, glow, raised z-index |
| Settled | `--ok` | `#9ece6a` (green) | — |
| Dimmed | `--raise` | `#292e42` | `opacity .5`, muted label |
| Pending | `--cube` → `--accent` | `#7aa2f7` (blue) | — |

`--cube` exists so themes whose accent collides with `--warn` or `--ok` (Swiss,
Phosphor) can give pending cubes their own colour; `tests/themes.test.mjs`
enforces that the three states never resolve to the same value.

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
| DISTANCES row | `frame.distances` (Dijkstra) |
| SHORTEST PATH row | `frame.path` (Dijkstra) |
| Cube corner badge | `item.badge` — a Dijkstra distance or a BFS/DFS visit number |
| Thick green edges | consecutive pairs in `frame.path` |
| INVARIANT row | `algorithm.insight` (static per algorithm) |
| TIME / SPACE badges | `algorithm.time` / `algorithm.space` |
| Code filename | `algorithm.id` with `-` → `_`, plus a per-language extension |
