# Architecture

## Directory layout

```
AlgorithmAtlas/
├── app/                        Application code (Next.js App Router conventions)
│   ├── layout.tsx              Root layout, <html>/<body>, metadata + OG/Twitter tags
│   ├── page.tsx                Server component that renders <AlgorithmLab/>
│   ├── AlgorithmLab.tsx        "use client" — all UI state and layout
│   ├── algorithmData.ts        Catalog of 13 algorithm definitions
│   ├── simulation.ts           Trace builders: AlgorithmDefinition + input → SimFrame[]
│   ├── CubeStage.tsx           Animated 2D stage, driven by the current SimFrame
│   ├── SyntaxCode.tsx          Regex tokenizer + highlighted <pre> listing
│   ├── codeSamples.ts          Merges and compiles the curated samples
│   ├── code/
│   │   ├── sample.ts           CodeSample type + §marker§ compiler
│   │   ├── search.ts           Marker-annotated samples: searching
│   │   ├── sorting.ts          Marker-annotated samples: sorting
│   │   ├── trees.ts            Marker-annotated samples: trees
│   │   ├── graphs.ts           Marker-annotated samples: graphs
│   │   └── recursion.ts        Marker-annotated samples: recursion
│   ├── themes.ts               Ten theme definitions: labels and picker swatches
│   ├── chatgpt-auth.ts         Dormant ChatGPT header auth helpers
│   └── globals.css             The entire visual system
├── github-pages/               Static SPA entry for the GitHub Pages build
│   ├── index.html              HTML shell with %BASE_URL% favicon + social tags
│   └── main.tsx                createRoot(...).render(<AlgorithmLab/>)
├── worker/index.ts             Cloudflare Worker entry (image optimization + App Router)
├── db/                         D1 + Drizzle accessor and (empty) schema
├── drizzle/                    Generated migration output; journal currently empty
├── examples/d1/                Opt-in D1 reference (notes table + /api/notes route)
├── build/sites-vite-plugin.ts  Post-build packaging of .openai metadata
├── tests/                      Node test-runner suites
├── public/                     favicon, og.png, misc SVGs
├── screenshots/                Marketing screenshots (v2)
├── .github/workflows/pages.yml GitHub Pages build + deploy
├── vite.config.ts              Worker/SSR dev+build config (vinext + Cloudflare)
├── vite.pages.config.ts        Static SPA build config (root: github-pages, base: /AlgorithmAtlas/)
├── next.config.ts              Empty Next config (kept for tooling compatibility)
├── drizzle.config.ts           SQLite dialect, schema ./db/schema.ts, out ./drizzle
├── eslint.config.mjs           Flat config: next core-web-vitals + typescript
├── postcss.config.mjs          Registers @tailwindcss/postcss (currently unused by the CSS)
└── tsconfig.json               strict, noEmit, bundler resolution, "@/*" → "./*"
```

## Module graph

```
page.tsx
  └─ AlgorithmLab.tsx ("use client")
       ├─ algorithmData.ts ── algorithms[], categories, languages
       ├─ simulation.ts ───── buildSimulation() → SimFrame[]   (imports AlgorithmDefinition)
       ├─ codeSamples.ts ──── getCodeSample()  → CodeSample
       │    ├─ code/{search,sorting,trees,graphs,recursion}.ts (§marker§ sources)
       │    └─ code/sample.ts (compileSample)
       ├─ CubeStage.tsx ───── DOM/SVG stage; imports graphEdges + SimFrame from simulation.ts
       └─ SyntaxCode.tsx ──── tokenizer; imports Language + CodeSample types
```

There are no circular imports. `simulation.ts` and `algorithmData.ts` are pure
and framework-free, which is what lets `tests/code-sync.test.mjs` import them
directly with Node's TypeScript stripping.

## Data flow

1. **Selection.** `AlgorithmLab` keeps `selected` (algorithm id), `category`,
   `language`, `input`, `variant`, `step`, `playing`, and `speed` in `useState`.
   Choosing an algorithm resets the input to its `defaultInput`, picks the first
   variant, rewinds to step 0, and pauses.
2. **Trace build.** `useMemo(() => buildSimulation(algorithm, input, variant))`
   recomputes the whole `SimFrame[]` whenever the algorithm, the raw input
   string, or the variant changes. Traces are fully materialized up front — the
   scrubber can jump anywhere in O(1).
3. **Frame selection.** `safeStep = min(step, trace.length - 1)` guards against a
   stale index after a shorter trace is built; `current = trace[safeStep]`.
4. **Rendering.** `current` drives three consumers simultaneously:
   - `CubeStage` diffs it against the live DOM and animates each cube,
   - the caption/legend/live-state panels read `message`, `detail`, `phase`,
     `pointers`, `frontier`, `visited`,
   - `current.codeKey` looks up `sample.highlights[codeKey]` to decide which
     source lines glow.
5. **Playback.** A `setTimeout` of `820 / speed` ms advances one step while
   `playing` is true, and auto-pauses on the last frame. Speeds are 0.5×, 1×,
   1.5×, 2×.

## Two build targets, one UI

The same `AlgorithmLab` component is shipped two different ways:

| Target | Config | Entry | Output | Command |
| --- | --- | --- | --- | --- |
| Cloudflare Worker / SSR | `vite.config.ts` | `worker/index.ts` → App Router → `app/page.tsx` | `dist/` (incl. `dist/server/index.js`) | `npm run dev` / `build` / `start` |
| Static SPA | `vite.pages.config.ts` | `github-pages/main.tsx` | `out/` with base `/AlgorithmAtlas/` | `npm run build:pages` |

The SSR target is what `tests/rendered-html.test.mjs` exercises (it imports the
built Worker and fetches `/` with a stubbed `ASSETS` binding). The static target
is what actually ships to the public demo.

## Design decisions worth knowing

- **Simulations are data, not execution.** Nothing in `app/code/` is ever
  evaluated. The displayed source is illustrative; the behaviour comes from
  separate hand-written trace builders in `simulation.ts`. The samples are
  written to mirror the builders line for line, and
  `tests/code-sync.test.mjs` enforces the contract: every `codeKey` a builder
  emits must resolve to explicit lines in all four languages.
- **Frames are immutable snapshots.** `snapshot()` deep-copies `items` and
  copies the `active`/`settled`/`dimmed` arrays, so trace builders are free to
  mutate their working array in place (bubble sort literally swaps elements).
- **Cube identity is stable.** Items carry an `id` (`item-3`, `node-2`, `A`,
  `call-5`). React keys the cube elements by id, so a swap animates as two cubes
  gliding rather than two labels blinking.
- **React owns the elements; rAF owns the motion.** `CubeStage` renders one
  absolutely positioned element per cube and never re-renders during an
  animation. A layout effect compares each cube's live position against its new
  target and drives `transform` from a `requestAnimationFrame` loop, so motion
  is never interrupted by React's render cycle.
- **The stage is resolution-independent.** Everything is laid out in a fixed
  660×360 logical space; a `ResizeObserver` scales the wrapper to fit, so one
  set of coordinates works at every breakpoint.
