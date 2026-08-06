import assert from "node:assert/strict";
import test from "node:test";
import { cubeVisualSignature } from "../app/cubeCache.ts";
import { algorithms } from "../app/algorithmData.ts";
import { buildSimulation } from "../app/simulation.ts";

test("invalidates a cached cube when the input changes its label", () => {
  const before = cubeVisualSignature({ id: "item-0", label: "9" });
  const after = cubeVisualSignature({ id: "item-0", label: "42" });

  assert.notEqual(after, before);
});

test("keeps an unchanged cube cache entry stable", () => {
  const before = cubeVisualSignature({ id: "item-0", label: "9" });
  const after = cubeVisualSignature({ id: "item-0", label: "9" });

  assert.equal(after, before);
});

test("rebuilds simulation items from edited input", () => {
  const algorithm = algorithms.find(item => item.id === "binary-search");
  assert.ok(algorithm);

  const before = buildSimulation(algorithm, "1, 3, 5 | 3", "")[0];
  const after = buildSimulation(algorithm, "10, 20, 30 | 20", "")[0];

  assert.deepEqual(before.items.map(item => item.label), ["1", "3", "5"]);
  assert.deepEqual(after.items.map(item => item.label), ["10", "20", "30"]);
});
