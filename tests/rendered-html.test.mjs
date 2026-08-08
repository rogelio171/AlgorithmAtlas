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
  assert.match(html, /Three-dimensional Linear search simulation/);
});

test("keeps simulation, highlighting, and responsive motion in source", async () => {
  const [lab, scene, syntax, css] = await Promise.all([
    readFile(new URL("../app/AlgorithmLab.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/CubeScene.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/SyntaxCode.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(lab, /buildSimulation/);
  assert.match(scene, /BoxGeometry/);
  assert.match(scene, /\.position\.lerp/);
  assert.match(syntax, /tok-\$\{kind\}/);
  assert.match(css, /--bg:#1a1b26/);
  assert.match(css, /prefers-reduced-motion/);
});
