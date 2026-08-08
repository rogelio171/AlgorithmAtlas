# Tech stack

Versions below are the exact pins from `package.json` at the time of writing.

## Runtime requirements

| Requirement | Value | Why |
| --- | --- | --- |
| Node.js | `>=22.13.0` (enforced via `engines`) | Vite 8 and the Cloudflare plugin need a modern Node; the direct-`.ts` tests rely on Node's type stripping |
| Package manager | npm (a `package-lock.json` is committed) | CI uses `npm ci` |
| Module system | ESM (`"type": "module"`) | All configs are `.mjs`/`.ts` ESM |

## Application dependencies

| Package | Version | Role in this project |
| --- | --- | --- |
| `react` / `react-dom` | 19.2.6 | The whole UI. `AlgorithmLab` is a client component; `app/page.tsx` and `app/layout.tsx` are server components |
| `next` | 16.2.6 | App Router conventions — `app/layout.tsx`, `app/page.tsx`, `metadata` export, `next/headers`, `next/navigation` |
| `three` | ^0.185.1 | The cube simulation: renderer, scene graph, lights, shadows, `OrbitControls`, canvas-texture labels |
| `drizzle-orm` | 0.45.2 | Present for the D1 database path only. **Not used by Algorithm Atlas itself** — `db/schema.ts` is intentionally empty |
| `react-loading-skeleton` | 3.5.0 | Declared but not imported anywhere in the app today |

## Build and tooling dependencies

| Package | Version | Role |
| --- | --- | --- |
| `vinext` | 0.0.50 | The dev/build/start runtime. Runs Next.js App Router semantics on top of Vite and Cloudflare Workers instead of the Next.js server |
| `vite` | 8.0.13 | Underlying bundler for both build targets |
| `@vitejs/plugin-react` | 6.0.2 | JSX/Fast Refresh for the GitHub Pages build |
| `@vitejs/plugin-rsc` | 0.5.26 | React Server Components support used by `vinext` |
| `react-server-dom-webpack` | 19.2.6 | RSC wire-format runtime (peer of the RSC plugin) |
| `@cloudflare/vite-plugin` | 1.37.1 | Wires Wrangler/Miniflare into `vite dev` so the Worker entry runs locally |
| `wrangler` | 4.92.0 | Cloudflare Workers toolchain (local Miniflare emulation, D1/R2 bindings) |
| `drizzle-kit` | 0.31.10 | `npm run db:generate` — emits SQLite migrations into `drizzle/` |
| `typescript` | 5.9.3 | Strict mode, `noEmit`, bundler module resolution, `@/*` path alias |
| `eslint` + `eslint-config-next` | 9.39.4 / 16.2.6 | Flat config in `eslint.config.mjs`, core-web-vitals + TypeScript rulesets |
| `tailwindcss` + `@tailwindcss/postcss` | 4.2.1 | Configured in `postcss.config.mjs` but **`app/globals.css` never imports Tailwind** — all styling is hand-written CSS. This is leftover template scaffolding |
| `@types/*` | — | Type definitions for Node, React, React DOM |

## Styling

There is no CSS framework in effect. `app/globals.css` (~60 dense lines) is the
entire visual system:

- **Tokyo Night palette** exposed as CSS custom properties on `:root`
  (`--bg:#1a1b26`, `--blue:#7aa2f7`, `--purple:#bb9af7`, `--green:#9ece6a`,
  `--yellow:#e0af68`, and friends). The same hex values are duplicated as
  numeric literals inside `CubeScene.tsx` so the 3D scene matches the DOM.
- **CSS Grid** workspace (`225px` catalog rail + fluid lab column) that
  collapses to a flex column under 780px.
- Three responsive breakpoints: 1250px, 780px, 440px.
- A `prefers-reduced-motion` block that flattens every animation and transition
  to 0.01ms.
- Syntax-token classes (`.tok-keyword`, `.tok-string`, `.tok-number`,
  `.tok-comment`, `.tok-type`, `.tok-function`, `.tok-operator`, `.tok-plain`)
  consumed by `SyntaxCode.tsx`.

## Platform pieces that exist but are dormant

These come from the `vinext` starter template and are kept so the project can
grow into a hosted app without re-scaffolding:

| Piece | File | Status |
| --- | --- | --- |
| Cloudflare Worker entry | `worker/index.ts` | Active in `npm run dev`/`build`/`start`. Handles `/_vinext/image` optimization, otherwise delegates to the App Router handler |
| D1 database accessor | `db/index.ts` | Throws a descriptive error unless a `DB` binding exists. Never called by the app |
| Drizzle schema | `db/schema.ts` | Deliberately empty (`export {}`) |
| D1 example | `examples/d1/` | A reference `notes` table plus a REST route. Not wired into routing |
| ChatGPT auth helpers | `app/chatgpt-auth.ts` | Reads `oai-authenticated-user-*` request headers and can redirect to `/signin-with-chatgpt`. No page calls it |
| Hosting metadata | `.openai/hosting.json` | `d1` and `r2` are `null`, so no bindings are provisioned |
| Sites build plugin | `build/sites-vite-plugin.ts` | Copies `.openai/hosting.json` and `drizzle/` into `dist/.openai/` after a build |
