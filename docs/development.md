# Development guide

## Prerequisites

- **Node.js 22.13 or newer** (enforced by `engines` in `package.json`)
- npm (the repo commits `package-lock.json`; CI runs `npm ci`)

## Setup

```bash
git clone https://github.com/rogelio171/AlgorithmAtlas.git
cd AlgorithmAtlas
npm install
npm run dev
```

Open the URL the dev server prints. The dev server runs the app through
`vinext` + the Cloudflare Vite plugin, which means the request path is the same
one production uses: `worker/index.ts` → App Router → `app/page.tsx`.

## npm scripts

| Script | Command | What it does |
| --- | --- | --- |
| `npm run dev` | `vinext dev` | Dev server with HMR, Worker runtime, and Miniflare bindings |
| `npm run build` | `vinext build` | Production build into `dist/` (includes `dist/server/index.js`) |
| `npm start` | `vinext start` | Serves the production build locally |
| `npm run build:pages` | `vite build --config vite.pages.config.ts` | Static SPA export into `out/` with base `/AlgorithmAtlas/` |
| `npm test` | `npm run build && node --test tests/rendered-html.test.mjs` | Builds, then asserts the SSR HTML |
| `npm run lint` | `eslint . --ignore-pattern dist --ignore-pattern .next` | Next core-web-vitals + TypeScript rules |
| `npm run db:generate` | `drizzle-kit generate` | Emits SQLite migrations into `drizzle/` (unused today — `db/schema.ts` is empty) |

All three `vinext` scripts set `WRANGLER_LOG_PATH=.wrangler/wrangler.log` so
Wrangler keeps its logs inside the project instead of a global directory.
`.wrangler/` is gitignored.

## Tests

Two suites, both using the built-in `node --test` runner.

### `tests/rendered-html.test.mjs` — SSR smoke test

Imports the built Worker (`dist/server/index.js`) with a cache-busting query
string, fetches `/` with a stubbed `ASSETS` binding, and asserts the response
contains the title, `LIVE CUBE TRACE`, `Linear search`, the code panel's
`typescript source code` aria-label, a `tok-keyword` span, a `sim-cube`, and the
stage's aria-label. Further tests grep the source for the load-bearing details:
`buildSimulation`, the stage's easing and `requestAnimationFrame` loop, its arc
and reduced-motion paths, the `tok-${kind}` template, the `--bg:#1a1b26` token,
and the `prefers-reduced-motion` block.

Because it imports the build output, **this suite requires `npm run build`
first** — which is why `npm test` chains them.

### `tests/code-sync.test.mjs` — the debugger contract

Imports the app's TypeScript directly, relying on Node's type stripping. For
every algorithm × preset × variant, it builds the full simulation and asserts
that every emitted `codeKey` resolves to explicit, in-range highlight lines in
all four languages — so a step can never point at the wrong (or no) source
line. It also pins the default exercise to the first catalog entry, checks no
`§` marker leaks into rendered code, verifies editing the input rebuilds the
cube labels, and pins cube-id stability across a trace (ids must not change
mid-trace, or cubes would teleport instead of animating).

### `tests/themes.test.mjs` — theme integrity

Checks all ten themes exist with Tokyo Night as the default, that each has a
`[data-theme]` block in `globals.css` defining the tokens the stage renders
with, and that pending / active / settled cubes resolve to three **distinct**
colors in every theme.

> **Note:** the two pure-TS suites are not part of the `npm test` script. Run
> them explicitly:
>
> ```bash
> node --test tests/code-sync.test.mjs tests/themes.test.mjs
> ```

## Linting

```bash
npm run lint
```

Flat config in `eslint.config.mjs` composes `eslint-config-next/core-web-vitals`
and `eslint-config-next/typescript`, then re-declares the default ignores
(`.next/`, `out/`, `build/`, `next-env.d.ts`) because composing the configs
otherwise drops them.

There is no `typecheck` script; `tsconfig.json` sets `noEmit` and `strict`, so
run `npx tsc --noEmit` if you want a standalone type pass.

## Code conventions in this repo

The existing code has a distinctive, deliberately compact style. Match it:

- **Dense one-liners in data modules.** `algorithmData.ts` and `layout.tsx`
  minimise whitespace; `simulation.ts` and `CubeStage.tsx` use normal
  formatting with occasional multiple statements per line.
- **Descriptive identifiers in logic, terse ones in snippets.** Trace builders
  use `middle`, `boundary`, `frontier`; the embedded code snippets use `a`, `t`,
  `l`, `h` to stay short.
- **Named exports** everywhere except React page/component defaults.
- **No comments unless they earn it.** The codebase is nearly comment-free; the
  few that exist explain non-obvious platform behaviour (the Seatbelt HMR
  workaround in `vite.config.ts`, the image-security note in `worker/index.ts`).
- **`"use client"` only where needed** — `AlgorithmLab.tsx` and `CubeStage.tsx`.

## Working on the simulation stage

- **Colours live only in CSS.** The stage reads the same `[data-theme]` tokens
  as the rest of the UI, so a new theme needs no stage code. Keep pending
  (`--cube`, defaulting to `--accent`), active (`--warn`), and settled (`--ok`)
  visibly distinct — `tests/themes.test.mjs` fails the build if any two collide.
- **Never animate through React.** The rAF loop writes `transform` directly on
  the cube elements; re-rendering mid-flight would fight it. If you add motion,
  extend the loop in the layout effect and always `cancelAnimationFrame` the
  previous handle for that cube first.
- **Layout is in logical 660×360 units.** Add new structures to
  `layoutPosition()`, not to the CSS.
- **Respect reduced motion.** `CubeStage` reads `prefers-reduced-motion` once
  and jumps cubes straight to their targets; keep any new effect behind the
  same check.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `npm test` fails on a missing `dist/server/index.js` | Run `npm run build` first, or use `npm test` which chains it |
| A `.ts`-importing test fails to parse TypeScript | Node too old — needs 22.13+, and possibly `--experimental-strip-types` |
| Dev server HMR does not fire on macOS in a sandbox | `vite.config.ts` switches to polling when `CODEX_SANDBOX=seatbelt`; set that env var |
| `Cloudflare D1 binding \`DB\` is unavailable` | Expected — nothing in the app calls `getDb()`. Set `d1` in `.openai/hosting.json` if you actually want a database |
| Cubes show stale numbers after editing input | A trace builder is reusing cube ids across different values |

## Known gaps

- `react-loading-skeleton` is a dependency but unused.
- Tailwind is registered in PostCSS but never imported by `globals.css`.
- `tests/code-sync.test.mjs` and `tests/themes.test.mjs` are not wired into
  `npm test`, and CI runs only `build:pages` — neither `lint` nor `test`.
