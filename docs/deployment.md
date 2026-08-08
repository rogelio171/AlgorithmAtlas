# Deployment

The project has two independent delivery paths. Only the first is currently
live.

---

## 1. GitHub Pages (the live demo)

**URL:** <https://rogelio171.github.io/AlgorithmAtlas/>

### Workflow

`.github/workflows/pages.yml` runs on every push to `main` and on manual
`workflow_dispatch`.

```
push to main
  └─ build job (ubuntu-latest)
       ├─ actions/checkout@v6
       ├─ actions/setup-node@v6      (node 22, npm cache)
       ├─ actions/configure-pages@v5
       ├─ npm ci
       ├─ npm run build:pages        NEXT_PUBLIC_SITE_URL=https://rogelio171.github.io/AlgorithmAtlas/
       └─ actions/upload-pages-artifact@v4   (path: out)
  └─ deploy job
       └─ actions/deploy-pages@v4    (environment: github-pages)
```

Permissions granted: `contents: read`, `pages: write`, `id-token: write`.
Concurrency group `pages` with `cancel-in-progress: false`, so deploys queue
rather than cancel each other.

### What gets built

`vite.pages.config.ts` produces a plain client-rendered SPA — no server, no RSC:

```ts
{
  root: "github-pages",        // index.html + main.tsx live here
  base: "/AlgorithmAtlas/",    // required for a project Pages site
  publicDir: "../public",      // favicon.svg, og.png, .nojekyll
  plugins: [react()],
  build: { outDir: "../out", emptyOutDir: true },
}
```

`github-pages/main.tsx` mounts the same `AlgorithmLab` component the SSR build
renders, wrapped in `<StrictMode>`. This is only possible because `AlgorithmLab`
and its dependency tree are framework-neutral React — nothing in the render path
touches `next/headers`, `next/navigation`, or server-only APIs.

### Things that matter for the base path

- `base: "/AlgorithmAtlas/"` rewrites asset URLs; `index.html` uses
  `%BASE_URL%favicon.svg` so the icon resolves under the subpath.
- `public/.nojekyll` stops GitHub Pages from filtering files that start with an
  underscore.
- The OG/Twitter tags in `github-pages/index.html` hardcode the absolute
  `https://rogelio171.github.io/AlgorithmAtlas/` URLs. **If the repo or owner is
  renamed, update `base`, the OG URLs, and the workflow's
  `NEXT_PUBLIC_SITE_URL` together.**

### Verifying locally

```bash
npm run build:pages
npx serve out          # or any static file server
```

Note that opening `out/index.html` directly from the filesystem will not work —
the `/AlgorithmAtlas/` base path needs to be served from that prefix.

---

## 2. Cloudflare Workers / vinext (SSR)

This path is fully wired but not currently deployed anywhere.

### Request flow

```
Request
  └─ worker/index.ts (default export .fetch)
       ├─ /_vinext/image  → handleImageOptimization(...)
       │                     fetches the asset via env.ASSETS,
       │                     transforms with env.IMAGES,
       │                     restricted to DEFAULT_DEVICE_SIZES + DEFAULT_IMAGE_SIZES
       └─ everything else → vinext/server/app-router-entry handler
                             → app/layout.tsx + app/page.tsx → <AlgorithmLab/>
```

The `Env` interface declares three bindings: `ASSETS` (static asset fetcher),
`DB` (D1), and `IMAGES` (Cloudflare Images transform pipeline).

### Local bindings

`vite.config.ts` builds a Wrangler config inline rather than shipping a
`wrangler.toml`:

- `main: "./worker/index.ts"`, `compatibility_flags: ["nodejs_compat"]`
- `d1_databases` and `r2_buckets` are populated **only if** `.openai/hosting.json`
  names a binding. Both are `null` today, so neither is created.
- Wrangler/Miniflare state is forced project-local:
  `WRANGLER_WRITE_LOGS=false`, `WRANGLER_LOG_PATH=.wrangler/logs`,
  `MINIFLARE_REGISTRY_PATH=.wrangler/registry`.
- When `CODEX_SANDBOX=seatbelt`, Vite switches to polling because macOS Seatbelt
  blocks FSEvents.

`@cloudflare/vite-plugin` is imported dynamically **after** the log-path env vars
are set, because Wrangler snapshots its log path at import time.

### Build output

`npm run build` writes `dist/`. Afterwards the `sites()` plugin
(`build/sites-vite-plugin.ts`) runs in `closeBundle` and packages platform
metadata:

```
dist/.openai/
├── hosting.json     (copied from .openai/hosting.json, if present)
└── drizzle/         (copied from ./drizzle, if present)
```

It clears `dist/.openai` first and tolerates either source being absent.

### Enabling the database

The D1 path is scaffolded end to end but inert:

1. Set `"d1": "DB"` in `.openai/hosting.json` (and `"r2": "..."` for a bucket).
2. Define tables in `db/schema.ts` — see `examples/d1/db/schema.ts` for a
   `notes` table.
3. Run `npm run db:generate` to emit SQL into `drizzle/`; the journal in
   `drizzle/meta/_journal.json` is currently empty.
4. Call `getDb()` from `db/index.ts` in a route handler. It throws a descriptive
   error if the binding is missing.
5. Deploy so the platform applies the generated migrations.

`examples/d1/app/api/notes/route.ts` is a working reference (GET list + POST
create) including friendly handling of the "no such table" error, but it lives
outside `app/` so it is not routable as-is.

### ChatGPT authentication (dormant)

`app/chatgpt-auth.ts` reads `oai-authenticated-user-email` and
`oai-authenticated-user-full-name` request headers, and exposes
`getChatGPTUser()`, `requireChatGPTUser(returnTo)`, `chatGPTSignInPath()`, and
`chatGPTSignOutPath()`. Return paths are validated to be relative, non-protocol
-relative, and not one of the reserved `/signin-with-chatgpt`,
`/signout-with-chatgpt`, `/callback` paths. Nothing in the app calls any of it
today.
