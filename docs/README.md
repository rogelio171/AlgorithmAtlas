# Algorithm Atlas — Documentation

Algorithm Atlas is an interactive learning lab that keeps three things in sync
on a single screen:

1. a **step trace** of an algorithm running on your input,
2. an **animated 2D cube stage** that shows the data structure changing, and
3. a **source listing** in TypeScript, Python, Go, or Java with the currently
   executing lines highlighted.

Everything runs client-side. There is no backend, no database in use, and no
algorithm ever executes as real code — each simulation is a deterministic,
pre-computed list of frames built in TypeScript.

## Documentation map

| Document | What it covers |
| --- | --- |
| [`tech-stack.md`](./tech-stack.md) | Every dependency, why it is there, and what is scaffolding vs. actually used |
| [`architecture.md`](./architecture.md) | Directory layout, module graph, data flow, and the two build targets |
| [`how-it-works.md`](./how-it-works.md) | The simulation engine, the 3D renderer, and the code-highlighting pipeline in detail |
| [`algorithms.md`](./algorithms.md) | The 13-algorithm catalog: inputs, presets, variants, and complexity |
| [`development.md`](./development.md) | Local setup, npm scripts, tests, linting, and known gaps |
| [`deployment.md`](./deployment.md) | The GitHub Pages workflow and the Cloudflare Worker path |
| [`adding-an-algorithm.md`](./adding-an-algorithm.md) | Step-by-step recipe for extending the catalog |

## Quick orientation

```
User edits input ─┐
Picks algorithm ──┼─► buildSimulation() ─► SimFrame[] ─┬─► CubeStage   (animated 2D)
Picks variant ────┘   (app/simulation.ts)              ├─► scene caption + live state
                                                       └─► frame.codeKey
                                                             │
Picks language ──────► getCodeSample() ─► CodeSample ─────────┴─► SyntaxCode (line highlight)
                       (app/codeSamples.ts)
```

`AlgorithmLab` holds all state — selected algorithm, category filter, language,
input string, variant, step index, play/pause, and speed. Every other component
is a pure function of that state.

## Fastest path to running it

```bash
npm install
npm run dev
```

Requires Node.js 22.13 or newer. See [`development.md`](./development.md) for
the full script reference.

## Live demo

<https://rogelio171.github.io/AlgorithmAtlas/>
