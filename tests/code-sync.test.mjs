import assert from "node:assert/strict";
import test from "node:test";
import { algorithms, languages } from "../app/algorithmData.ts";
import { getCodeSample } from "../app/codeSamples.ts";
import { buildSimulation } from "../app/simulation.ts";

test("every algorithm has a code sample in every language", () => {
  for (const algorithm of algorithms) {
    for (const { id: language } of languages) {
      const sample = getCodeSample(algorithm.id, language);
      assert.ok(sample.code.trim().length, `${algorithm.id}/${language} has no code`);
      assert.ok(!sample.code.includes("§"), `${algorithm.id}/${language} leaks a marker`);
    }
  }
});

test("every simulation step maps to explicit highlight lines", () => {
  for (const algorithm of algorithms) {
    const variants = algorithm.variants ?? [""];
    const inputs = [algorithm.defaultInput, ...algorithm.presets.map(preset => preset.value)];
    for (const variant of variants) {
      for (const input of inputs) {
        const codeKeys = new Set(buildSimulation(algorithm, input, variant).map(frame => frame.codeKey));
        for (const { id: language } of languages) {
          const sample = getCodeSample(algorithm.id, language);
          const total = sample.code.split("\n").length;
          for (const codeKey of codeKeys) {
            const lines = sample.highlights[codeKey];
            assert.ok(lines?.length, `${algorithm.id}/${language}: no lines for "${codeKey}"`);
            for (const line of lines) {
              assert.ok(line >= 1 && line <= total, `${algorithm.id}/${language}: "${codeKey}" points at line ${line} of ${total}`);
            }
          }
        }
      }
    }
  }
});

test("the default exercise is the first catalog entry", () => {
  assert.equal(algorithms[0].id, "linear-search");
});

test("rebuilds simulation items from edited input", () => {
  const algorithm = algorithms.find(item => item.id === "binary-search");
  assert.ok(algorithm);

  const before = buildSimulation(algorithm, "1, 3, 5 | 3", "")[0];
  const after = buildSimulation(algorithm, "10, 20, 30 | 20", "")[0];

  assert.deepEqual(before.items.map(item => item.label), ["1", "3", "5"]);
  assert.deepEqual(after.items.map(item => item.label), ["10", "20", "30"]);
});

test("cube ids stay stable across a trace so moves animate instead of teleporting", () => {
  const algorithm = algorithms.find(item => item.id === "bubble-sort");
  const trace = buildSimulation(algorithm, algorithm.defaultInput, "");
  const first = new Set(trace[0].items.map(item => item.id));
  for (const frame of trace) {
    assert.deepEqual(new Set(frame.items.map(item => item.id)), first);
    assert.equal(new Set(frame.items.map(item => item.id)).size, frame.items.length);
  }
});
