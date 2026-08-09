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

test("searches end on a resolved result, not a still-active cube", () => {
  for (const id of ["linear-search", "binary-search"]) {
    const algorithm = algorithms.find(item => item.id === id);
    for (const preset of [{ label: "default", value: algorithm.defaultInput }, ...algorithm.presets]) {
      const last = buildSimulation(algorithm, preset.value, "").at(-1);
      const where = `${id}/${preset.label}`;

      // Nothing is left mid-operation once the search has returned.
      assert.equal(last.active.length, 0, `${where}: last frame still marks a cube active`);
      assert.equal(last.phase, "Complete", `${where}: last frame is not a terminal frame`);

      if (/found at index/.test(last.message)) {
        // The hit is resolved, and resolved wins over every other state.
        assert.equal(last.settled.length, 1, `${where}: the found cube is not settled`);
        assert.ok(!last.dimmed.includes(last.settled[0]), `${where}: the found cube is also dimmed`);
      } else {
        // A miss resolves nothing — every cube is ruled out instead.
        assert.equal(last.settled.length, 0, `${where}: a failed search settled a cube`);
        assert.equal(last.dimmed.length, last.items.length, `${where}: a failed search left cubes unresolved`);
      }
    }
  }
});

test("merge sort physically separates runs and merges them back up", () => {
  const algorithm = algorithms.find(item => item.id === "merge-sort");
  const trace = buildSimulation(algorithm, "9, 4, 7, 3, 8, 2", "");

  // Every cube carries a lane (recursion depth) and a column.
  for (const frame of trace) {
    for (const item of frame.items) {
      assert.equal(typeof item.lane, "number", `${item.id} has no lane`);
      assert.equal(typeof item.col, "number", `${item.id} has no col`);
    }
  }

  // Splits push runs deeper than the top row, so the division is visible.
  const deepest = Math.max(...trace.flatMap(frame => frame.items.map(item => item.lane)));
  assert.ok(deepest >= 2, `runs never separated: deepest lane was ${deepest}`);

  // Single-value runs are called out, and merging is step-by-step.
  const keys = trace.map(frame => frame.codeKey);
  assert.ok(keys.includes("base"), "no base-case frame");
  assert.ok(keys.filter(key => key === "split").length >= 3, "not enough split frames");
  assert.ok(keys.filter(key => key === "merge").length >= 6, "merging is not step-by-step");

  // The trace ends back on one row, sorted.
  const last = trace.at(-1);
  assert.deepEqual(last.items.map(item => item.lane), last.items.map(() => 0));
  const finalOrder = [...last.items].sort((a, b) => a.col - b.col).map(item => Number(item.label));
  assert.deepEqual(finalOrder, [2, 3, 4, 7, 8, 9]);
});

test("dijkstra reports the shortest path to the requested target", () => {
  const algorithm = algorithms.find(item => item.id === "dijkstra");
  const trace = buildSimulation(algorithm, "A | F", "");
  const last = trace.at(-1);

  // A → C → D → F costs 2 + 1 + 4 = 7, beating A → B → E → F (4 + 3 + 2 = 9).
  assert.deepEqual(last.path, ["A", "C", "D", "F"]);
  assert.equal(last.distances.F, 7);
  assert.match(last.message, /A → C → D → F/);
  assert.match(last.detail, /7/);

  // Distances are shown on the cubes themselves throughout.
  assert.equal(trace[0].items.find(item => item.id === "A").badge, "0");
  assert.equal(trace[0].items.find(item => item.id === "F").badge, "∞");
  assert.equal(last.items.find(item => item.id === "F").badge, "7");

  // The target is honoured, not ignored: a different target gives another path.
  const other = buildSimulation(algorithm, "B | E", "").at(-1);
  assert.deepEqual(other.path, ["B", "E"]);
  assert.equal(other.distances.E, 3);
});

test("dijkstra shows its priority queue and accounts for every node", () => {
  const algorithm = algorithms.find(item => item.id === "dijkstra");

  // The queue it picks from is visible, and always nearest-first.
  const trace = buildSimulation(algorithm, "A | F", "");
  const queues = trace.map(frame => frame.frontier).filter(queue => queue?.length);
  assert.ok(queues.length > 3, "the priority queue is never shown");
  for (const queue of queues) {
    const distances = queue.map(entry => Number(entry.split(" ")[1]));
    assert.deepEqual(distances, [...distances].sort((a, b) => a - b), `queue out of order: ${queue}`);
  }

  // Stopping early must be explained, not left looking unfinished: every node
  // is either settled or visibly dimmed, never abandoned as plain "pending".
  for (const preset of algorithm.presets) {
    const last = buildSimulation(algorithm, preset.value, "").at(-1);
    const accounted = new Set([...last.settled, ...last.dimmed]);
    for (const item of last.items) {
      assert.ok(accounted.has(item.id), `${preset.label}: ${item.id} left unresolved`);
    }
    if (last.dimmed.length) assert.match(last.detail, /never had to be explored/);
  }

  // A short run really does skip work — that is the point of the early exit.
  const short = buildSimulation(algorithm, "B | E", "").at(-1);
  assert.deepEqual(short.dimmed.sort(), ["A", "C", "D", "F"]);
  assert.deepEqual(short.settled.sort(), ["B", "E"]);
});

test("breadth-first search numbers the cubes in visit order", () => {
  const algorithm = algorithms.find(item => item.id === "bfs");
  const last = buildSimulation(algorithm, "A", "").at(-1);
  assert.equal(last.items.find(item => item.id === "A").badge, "1");
  assert.equal(new Set(last.items.map(item => item.badge)).size, last.items.length);
  assert.match(last.detail, /Visit order: A → /);
});

test("factorial unwinds, showing each returned value and keeping the answer", () => {
  const algorithm = algorithms.find(item => item.id === "factorial");
  for (const [input, expected] of [["5", 120], ["1", 1], ["7", 5040]]) {
    const trace = buildSimulation(algorithm, input, "");
    const last = trace.at(-1);
    const n = Number(input);

    // Every frame stays on screen and resolves — the answer no longer vanishes.
    assert.equal(last.items.length, n, `n=${input}: the stack was cleared`);
    assert.equal(last.settled.length, n, `n=${input}: frames were never resolved`);
    assert.equal(last.active.length, 0, `n=${input}: last frame still active`);
    assert.equal(last.items.find(item => item.label === `f(${n})`).badge, String(expected));
    assert.match(last.message, new RegExp(`= ${expected}\\.$`));

    // Return values appear one at a time on the way back up, not all at once.
    const resolved = trace.map(frame => frame.items.filter(item => item.badge !== undefined).length);
    assert.equal(resolved[0], 0, `n=${input}: values shown before any call returned`);
    assert.equal(resolved.at(-1), n, `n=${input}: not every frame ended with a value`);
    for (let i = 1; i < resolved.length; i++) {
      assert.ok(resolved[i] - resolved[i - 1] <= 1, `n=${input}: more than one value appeared in a single step`);
      assert.ok(resolved[i] >= resolved[i - 1], `n=${input}: a returned value disappeared`);
    }
  }
});

test("fibonacci builds a real call tree that returns a real answer", () => {
  const algorithm = algorithms.find(item => item.id === "fibonacci");
  const expected = { 3: 2, 5: 5, 6: 8 };
  for (const [input, answer] of Object.entries(expected)) {
    const trace = buildSimulation(algorithm, input, "");
    const last = trace.at(-1);
    const root = last.items.find(item => !item.parent);

    // It computes the value instead of stopping mid-expansion.
    assert.equal(root.badge, String(answer), `fib(${input}) came out wrong`);
    assert.match(last.message, new RegExp(`fib\\(${input}\\) = ${answer}\\.`));
    assert.equal(last.dimmed.length, 0, `fib(${input}): calls were left unvisited`);
    assert.equal(last.settled.length, last.items.length, `fib(${input}): not every call returned`);

    // It is a tree: exactly one root, every other node has a live parent, and
    // node count matches the real number of calls fib(n) makes.
    const ids = new Set(last.items.map(item => item.id));
    assert.equal(last.items.filter(item => !item.parent).length, 1);
    for (const item of last.items) if (item.parent) assert.ok(ids.has(item.parent));
    const calls = n => (n <= 1 ? 1 : 1 + calls(n - 1) + calls(n - 2));
    assert.equal(last.items.length, calls(Number(input)), `fib(${input}): wrong number of calls`);

    // The call stack stays shallow even though the tree is wide.
    const deepest = Math.max(...trace.map(frame => frame.frontier?.length ?? 0));
    assert.ok(deepest <= Number(input), `fib(${input}): stack grew to ${deepest}`);
  }
});

test("fibonacci marks the subtrees it recomputes", () => {
  const algorithm = algorithms.find(item => item.id === "fibonacci");
  const last = buildSimulation(algorithm, "5", "").at(-1);
  assert.equal(last.items.filter(item => item.repeat).length, 3);
  assert.match(last.detail, /3 subtrees recomputed/);

  // fib(3) has no repeated subtree, so nothing should be flagged.
  const small = buildSimulation(algorithm, "3", "").at(-1);
  assert.equal(small.items.filter(item => item.repeat).length, 0);
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
