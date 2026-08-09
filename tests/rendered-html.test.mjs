import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the algorithm laboratory", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Algorithm Atlas/);
  assert.match(html, /LIVE CUBE TRACE/);
  assert.match(html, /Binary search/);
  assert.match(html, /typescript source code/);
  assert.match(html, /tok-keyword/);
  assert.match(html, /Linear search simulation/);
  assert.match(html, /sim-cube/);
});

test("keeps simulation, highlighting, and responsive motion in source", async () => {
  const [lab, stage, syntax, css] = await Promise.all([
    readFile(new URL("../app/AlgorithmLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/CubeStage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SyntaxCode.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(lab, /buildSimulation/);
  assert.match(stage, /easeInOutCubic/);
  assert.match(stage, /requestAnimationFrame/);
  assert.match(syntax, /tok-\$\{kind\}/);
  assert.match(css, /--bg:#1a1b26/);
  assert.match(css, /prefers-reduced-motion/);
});

test("the stage animates with eased arcs, squash, and a reduced-motion path", async () => {
  const stage = await readFile(new URL("../app/CubeStage.tsx", import.meta.url), "utf8");
  assert.match(stage, /prefers-reduced-motion/);
  assert.match(stage, /Math\.sin\(Math\.PI \* k\)/);
  assert.match(stage, /arcOf/);
  assert.doesNotMatch(stage, /\bthree\b/);
});

test("the weighted graph draws its edge weights", async () => {
  const [stage, css] = await Promise.all([
    readFile(new URL("../app/CubeStage.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  // Without weights on the edges, "shortest" cannot be verified by eye.
  assert.match(stage, /const \[from, to, weight\] of graphEdges/);
  assert.match(stage, /<text[^>]*>\{weight\}<\/text>/);
  assert.match(css, /\.sim-links text\{/);
});
