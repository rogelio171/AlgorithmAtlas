import type { AlgorithmDefinition } from "./algorithmData";

export type CubeItem = {
  id: string;
  label: string;
  value?: number;
  slot?: number;
  // Divide-and-conquer layout: `lane` is the recursion depth (row) and `col`
  // the horizontal position, so split runs physically separate on the stage.
  lane?: number;
  col?: number;
  // Small corner annotation, e.g. a Dijkstra distance or a visit order.
  badge?: string;
};

export type SimFrame = {
  items: CubeItem[];
  active: string[];
  settled: string[];
  dimmed: string[];
  message: string;
  detail: string;
  codeKey: string;
  phase: string;
  pointers?: Record<string, string>;
  frontier?: string[];
  visited?: string[];
  distances?: Record<string, number>;
  // Ordered node ids whose connecting edges are the highlighted result path.
  path?: string[];
  // Total lanes used across the whole trace, so the stage can size the split
  // tree once instead of letting rows drift as the recursion deepens.
  lanes?: number;
};

export const graphEdges: [string, string, number][] = [
  ["A", "B", 4], ["A", "C", 2], ["B", "D", 5], ["B", "E", 3],
  ["C", "D", 1], ["C", "E", 6], ["D", "F", 4], ["E", "F", 2],
];

const graphNodes = ["A", "B", "C", "D", "E", "F"];
const adjacency = Object.fromEntries(graphNodes.map(node => [node, [] as [string, number][]]));
for (const [from, to, weight] of graphEdges) {
  adjacency[from].push([to, weight]);
  adjacency[to].push([from, weight]);
}

function parseInput(raw: string) {
  const [left = "", right = ""] = raw.split("|").map(value => value.trim());
  const values = left.split(",").map(Number).filter(Number.isFinite).slice(0, 9);
  return {
    values,
    target: Number(right),
    start: left.toUpperCase().charAt(0) || "A",
    end: right.toUpperCase().charAt(0) || "F",
  };
}

function numberItems(values: number[]): CubeItem[] {
  return values.map((value, index) => ({ id: `item-${index}`, label: String(value), value }));
}

function snapshot(
  items: CubeItem[], message: string, detail: string, codeKey: string, phase: string,
  active: string[] = [], settled: string[] = [], dimmed: string[] = [],
  extra: Partial<SimFrame> = {},
): SimFrame {
  return {
    items: items.map(item => ({ ...item })), active: [...active],
    settled: [...settled], dimmed: [...dimmed], message, detail, codeKey, phase, ...extra,
  };
}

function linearTrace(raw: string) {
  const { values: given, target } = parseInput(raw);
  const values = given.length ? given : [9, 3, 7, 1, 6];
  const items = numberItems(values);
  const frames = [snapshot(items, "Ready to search.", `Target: ${target}`, "setup", "Initialize")];
  const ruledOut: string[] = [];
  for (let index = 0; index < values.length; index++) {
    const id = items[index].id;
    frames.push(snapshot(items, `Inspect ${values[index]}.`, `Compare index ${index} with ${target}.`, "compare", "Compare", [id], [], ruledOut, { pointers: { cursor: id } }));
    if (values[index] === target) {
      frames.push(snapshot(items, `Found ${target}.`, `Return index ${index}.`, "match", "Match", [id], [id], ruledOut));
      return frames;
    }
    ruledOut.push(id);
    frames.push(snapshot(items, `${values[index]} is not the target.`, "Advance one cube.", "advance", "Advance", [], [], ruledOut));
  }
  frames.push(snapshot(items, `${target} is not present.`, "Every cube is ruled out.", "missing", "Complete", [], [], items.map(item => item.id)));
  return frames;
}

function binaryTrace(raw: string) {
  const { values: given, target } = parseInput(raw);
  const values = given.length ? given : [2, 5, 8, 12, 16, 23, 38];
  const items = numberItems(values);
  const frames = [snapshot(items, "Open the full search window.", `Target: ${target}`, "setup", "Initialize")];
  let low = 0, high = values.length - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const outside = items.filter((_, i) => i < low || i > high).map(item => item.id);
    frames.push(snapshot(items, `Probe the midpoint: ${values[middle]}.`, `Active indices ${low}–${high}.`, "probe", "Probe", [items[middle].id], [], outside, { pointers: { low: items[low].id, mid: items[middle].id, high: items[high].id } }));
    if (values[middle] === target) {
      frames.push(snapshot(items, `Found ${target}.`, `Return index ${middle}.`, "match", "Match", [items[middle].id], [items[middle].id], outside));
      return frames;
    }
    if (values[middle] < target) low = middle + 1;
    else high = middle - 1;
    const discarded = items.filter((_, i) => i < low || i > high).map(item => item.id);
    frames.push(snapshot(items, values[middle] < target ? "Discard the lower half." : "Discard the upper half.", "Only the remaining interval can contain the target.", "discard", "Narrow", [], [], discarded));
  }
  frames.push(snapshot(items, `${target} is not present.`, "The search interval is empty.", "missing", "Complete", [], [], items.map(item => item.id)));
  return frames;
}

function bubbleTrace(raw: string) {
  const { values: given } = parseInput(raw);
  const items = numberItems(given.length ? given : [8, 3, 6, 2, 7]);
  const frames = [snapshot(items, "Begin with an unsorted row.", "Compare neighbors left to right.", "setup", "Initialize")];
  for (let end = items.length - 1; end > 0; end--) {
    for (let index = 0; index < end; index++) {
      const pair = [items[index].id, items[index + 1].id];
      frames.push(snapshot(items, `Compare ${items[index].label} and ${items[index + 1].label}.`, "The larger cube should move right.", "compare", "Compare", pair));
      if ((items[index].value ?? 0) > (items[index + 1].value ?? 0)) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
        frames.push(snapshot(items, "Swap the inverted pair.", "Both cubes glide to their new slots.", "swap", "Swap", pair));
      }
    }
    frames.push(snapshot(items, `${items[end].label} is fixed in place.`, "One full pass is complete.", "pass", "Pass complete", [], items.slice(end).map(item => item.id)));
  }
  frames.push(snapshot(items, "The row is sorted.", "Every cube is in final position.", "done", "Complete", [], items.map(item => item.id)));
  return frames;
}

function insertionTrace(raw: string) {
  const { values: given } = parseInput(raw);
  const items = numberItems(given.length ? given : [7, 3, 5, 2, 8]);
  const frames = [snapshot(items, "The first cube starts the sorted prefix.", "Grow a sorted region from left to right.", "setup", "Initialize", [], [items[0].id])];
  for (let index = 1; index < items.length; index++) {
    const key = items[index];
    frames.push(snapshot(items, `Lift ${key.label} as the insertion key.`, "Compare it with the sorted prefix.", "select", "Select", [key.id], items.slice(0, index).map(item => item.id)));
    let cursor = index - 1;
    while (cursor >= 0 && (items[cursor].value ?? 0) > (key.value ?? 0)) {
      frames.push(snapshot(items, `${items[cursor].label} is larger than ${key.label}.`, "Shift the larger cube right.", "shift", "Shift", [items[cursor].id, key.id]));
      cursor--;
    }
    const oldIndex = items.findIndex(item => item.id === key.id);
    items.splice(oldIndex, 1); items.splice(cursor + 1, 0, key);
    frames.push(snapshot(items, `Insert ${key.label} at slot ${cursor + 1}.`, "The sorted prefix grows by one.", "insert", "Insert", [key.id], items.slice(0, index + 1).map(item => item.id)));
  }
  frames.push(snapshot(items, "The row is sorted.", "Every cube belongs to the sorted prefix.", "done", "Complete", [], items.map(item => item.id)));
  return frames;
}

function quickTrace(raw: string) {
  const { values: given } = parseInput(raw);
  const items = numberItems(given.length ? given : [9, 4, 7, 3, 10, 5]);
  const frames = [snapshot(items, "Choose a partition to sort.", "The final cube is the pivot.", "setup", "Initialize")];
  const sort = (low: number, high: number) => {
    if (low >= high) return;
    const pivot = items[high]; let boundary = low;
    frames.push(snapshot(items, `Pivot on ${pivot.label}.`, `Partition slots ${low}–${high}.`, "pivot", "Choose pivot", [pivot.id]));
    for (let scan = low; scan < high; scan++) {
      frames.push(snapshot(items, `Compare ${items[scan].label} with pivot ${pivot.label}.`, "Smaller cubes move left of the boundary.", "compare", "Partition", [items[scan].id, pivot.id]));
      if ((items[scan].value ?? 0) <= (pivot.value ?? 0)) {
        [items[scan], items[boundary]] = [items[boundary], items[scan]];
        frames.push(snapshot(items, "Move the cube into the lower partition.", `Boundary advances to ${boundary + 1}.`, "partition", "Partition", [items[boundary].id, items[scan].id]));
        boundary++;
      }
    }
    [items[boundary], items[high]] = [items[high], items[boundary]];
    frames.push(snapshot(items, `${pivot.label} reaches its final slot.`, "Recurse on both sides of the pivot.", "recurse", "Place pivot", [pivot.id], [pivot.id]));
    sort(low, boundary - 1); sort(boundary + 1, high);
  };
  sort(0, items.length - 1);
  frames.push(snapshot(items, "All partitions are ordered.", "Quicksort is complete.", "done", "Complete", [], items.map(item => item.id)));
  return frames;
}

function mergeTrace(raw: string) {
  const { values: given } = parseInput(raw);
  const values = given.length ? given : [8, 3, 6, 2, 7, 4];
  // Cube identity is fixed; `lane`/`col` move each cube around the split tree.
  const cubes: CubeItem[] = values.map((value, index) => ({ id: `item-${index}`, label: String(value), value, lane: 0, col: index }));
  const order = [...cubes];
  const frames: SimFrame[] = [];
  const GAP = .3;
  const run = (list: CubeItem[]) => list.map(item => item.label).join(", ");
  const shot = (message: string, detail: string, codeKey: string, phase: string, active: string[] = [], settled: string[] = []) =>
    frames.push(snapshot(cubes, message, detail, codeKey, phase, active, settled));

  shot("Start with one unsorted run.", `Split [${run(order)}] until every run holds one value.`, "setup", "Initialize");

  const sort = (start: number, end: number, lane: number, offset: number): CubeItem[] => {
    const segment = order.slice(start, end);
    if (segment.length < 2) {
      segment.forEach((cube, index) => { cube.lane = lane; cube.col = start + index + offset; });
      if (segment.length) shot(`Run [${run(segment)}] holds one value.`, "A single value is already sorted.", "base", "Base case", segment.map(cube => cube.id), segment.map(cube => cube.id));
      return segment;
    }
    const middle = Math.floor((start + end) / 2);
    const left = order.slice(start, middle), right = order.slice(middle, end);
    const leftOffset = offset - GAP, rightOffset = offset + GAP;
    left.forEach((cube, index) => { cube.lane = lane + 1; cube.col = start + index + leftOffset; });
    right.forEach((cube, index) => { cube.lane = lane + 1; cube.col = middle + index + rightOffset; });
    shot(`Split [${run(segment)}] down the middle.`, `Left [${run(left)}] · right [${run(right)}].`, "split", "Divide", segment.map(cube => cube.id));

    const sortedLeft = [...sort(start, middle, lane + 1, leftOffset)];
    const sortedRight = [...sort(middle, end, lane + 1, rightOffset)];

    const merged: CubeItem[] = [];
    const lift = (cube: CubeItem) => { cube.lane = lane; cube.col = start + merged.length + offset; merged.push(cube); };
    while (sortedLeft.length && sortedRight.length) {
      const [head, other] = [sortedLeft[0], sortedRight[0]];
      shot(`Compare ${head.label} and ${other.label}.`, `Fronts of [${run(sortedLeft)}] and [${run(sortedRight)}].`, "compare", "Merge", [head.id, other.id], merged.map(cube => cube.id));
      const taken = (head.value ?? 0) <= (other.value ?? 0) ? sortedLeft.shift()! : sortedRight.shift()!;
      lift(taken);
      shot(`Take ${taken.label} into the merged run.`, `Merged so far: [${run(merged)}].`, "merge", "Take", [taken.id], merged.map(cube => cube.id));
    }
    for (const remaining of [...sortedLeft, ...sortedRight]) {
      lift(remaining);
      shot(`Copy ${remaining.label} across.`, "One run is empty, so the rest carries over in order.", "merge", "Copy rest", [remaining.id], merged.map(cube => cube.id));
    }
    order.splice(start, end - start, ...merged);
    shot(`Run [${run(merged)}] is sorted.`, "Hand this run up to the level above.", "merge", "Run merged", [], merged.map(cube => cube.id));
    return merged;
  };

  sort(0, order.length, 0, 0);
  order.forEach((cube, index) => { cube.lane = 0; cube.col = index; });
  shot("The array is sorted.", `Final order: [${run(order)}].`, "done", "Complete", [], order.map(cube => cube.id));
  const lanes = Math.max(...frames.flatMap(frame => frame.items.map(item => item.lane ?? 0))) + 1;
  for (const frame of frames) frame.lanes = lanes;
  return frames;
}

function treeTrace(algorithm: AlgorithmDefinition, raw: string, variant: string) {
  const { values: given, target } = parseInput(raw);
  const values = given.length ? given : [8, 4, 12, 2, 6, 10, 14];
  const items = values.map((value, slot) => ({ id: `node-${slot}`, label: String(value), value, slot }));
  const frames = [snapshot(items, "Place the root cube.", "Children branch into the next level.", "setup", "Initialize")];
  const order: number[] = [];
  const mode = variant.toLowerCase();
  const visitKey = algorithm.id !== "tree-traversals" ? "visit"
    : mode.startsWith("pre") ? "visit-pre" : mode.startsWith("post") ? "visit-post" : "visit-in";
  if (algorithm.id === "tree-traversals") {
    const walk = (slot: number) => {
      if (slot >= items.length) return;
      if (mode.startsWith("pre")) order.push(slot);
      walk(slot * 2 + 1);
      if (mode.startsWith("in")) order.push(slot);
      walk(slot * 2 + 2);
      if (mode.startsWith("post")) order.push(slot);
    };
    walk(0);
  } else {
    let slot = 0;
    while (slot < items.length) {
      order.push(slot);
      if (values[slot] === target) break;
      slot = target < values[slot] ? slot * 2 + 1 : slot * 2 + 2;
    }
  }
  const visited: string[] = [];
  for (const slot of order) {
    const item = items[slot];
    visited.push(item.id);
    const branch = target < (item.value ?? 0) ? "left" : "right";
    const detail = algorithm.id === "bst-operations"
      ? `Compare with ${target}, then choose the ${branch} branch.`
      : `${variant} traversal emits this cube now.`;
    frames.push(snapshot(items, `Visit node ${item.label}.`, detail, visitKey, "Visit", [item.id], visited, [], {
      visited: visited.map(id => items.find(candidate => candidate.id === id)?.label ?? id),
      pointers: { current: item.id },
    }));
  }
  const message = algorithm.id === "bst-operations"
    ? `Search path for ${target} is complete.`
    : `${variant} traversal is complete.`;
  frames.push(snapshot(items, message, "Visited cubes remain illuminated.", "done", "Complete", [], visited));
  return frames;
}

function graphTrace(algorithm: AlgorithmDefinition, raw: string) {
  const { start: rawStart, end: rawEnd } = parseInput(raw);
  const start = graphNodes.includes(rawStart) ? rawStart : "A";
  const items: CubeItem[] = graphNodes.map(node => ({ id: node, label: node }));
  if (algorithm.id === "dijkstra") {
    const end = graphNodes.includes(rawEnd) && rawEnd !== start ? rawEnd : graphNodes.find(node => node !== start)!;
    return dijkstraTrace(items, start, end);
  }
  const frames = [snapshot(items, `Start at ${start}.`, "The frontier contains one cube.", "setup", "Initialize", [start], [], [], { frontier: [start] })];
  const frontier = [start], discovered = new Set([start]), visited: string[] = [];
  while (frontier.length) {
    const node = algorithm.id === "bfs" ? frontier.shift()! : frontier.pop()!;
    visited.push(node);
    items.find(item => item.id === node)!.badge = String(visited.length);
    frames.push(snapshot(items, `${algorithm.id === "bfs" ? "Dequeue" : "Pop"} ${node}.`, `Visit ${node} as number ${visited.length}.`, algorithm.id === "bfs" ? "dequeue" : "pop", "Visit", [node], visited, [], { frontier: [...frontier], visited: [...visited] }));
    const neighbors = adjacency[node].map(([next]) => next);
    for (const next of algorithm.id === "dfs" ? [...neighbors].reverse() : neighbors) {
      if (discovered.has(next)) continue;
      discovered.add(next); frontier.push(next);
      frames.push(snapshot(items, `Discover ${next} from ${node}.`, `Add ${next} to the ${algorithm.id === "bfs" ? "queue" : "stack"}.`, algorithm.id === "bfs" ? "enqueue" : "push", "Discover", [node, next], visited, [], { frontier: [...frontier], visited: [...visited] }));
    }
  }
  frames.push(snapshot(items, "Traversal complete.", `Visit order: ${visited.join(" \u2192 ")}.`, "done", "Complete", [], visited, [], { visited }));
  return frames;
}

function dijkstraTrace(items: CubeItem[], start: string, end: string) {
  const distances = Object.fromEntries(graphNodes.map(node => [node, Infinity])) as Record<string, number>;
  const previous: Record<string, string> = {};
  distances[start] = 0;
  const settled = new Set<string>();
  // Every cube wears its current best-known distance, so the numbers the
  // algorithm reasons about are visible on the stage itself.
  const stamp = () => {
    for (const item of items) item.badge = Number.isFinite(distances[item.id]) ? String(distances[item.id]) : "\u221e";
  };
  stamp();
  const frames = [snapshot(items, `Find the shortest path ${start} \u2192 ${end}.`, `${start} starts at 0; every other cube starts at \u221e.`, "setup", "Initialize", [start], [], [], { distances: { ...distances } })];

  while (settled.size < graphNodes.length) {
    const node = graphNodes.filter(candidate => !settled.has(candidate)).sort((a, b) => distances[a] - distances[b])[0];
    if (!node || !Number.isFinite(distances[node])) break;
    settled.add(node);
    stamp();
    frames.push(snapshot(items, `Settle ${node} at distance ${distances[node]}.`, node === end ? `${end} is settled, so its distance is final.` : "This is the closest unsettled cube; its distance can no longer improve.", "settle", "Settle", [node], [...settled], [], { distances: { ...distances }, visited: [...settled] }));
    if (node === end) break;
    for (const [next, weight] of adjacency[node]) {
      if (settled.has(next)) continue;
      const candidate = distances[node] + weight;
      frames.push(snapshot(items, `Test ${node} \u2192 ${next} (${weight}).`, `Candidate: ${distances[node]} + ${weight} = ${candidate} vs ${Number.isFinite(distances[next]) ? distances[next] : "\u221e"}.`, "relax", "Relax edge", [node, next], [...settled], [], { distances: { ...distances }, visited: [...settled] }));
      if (candidate < distances[next]) {
        distances[next] = candidate;
        previous[next] = node;
        stamp();
        frames.push(snapshot(items, `Update ${next} to ${candidate}.`, `A shorter route reaches ${next} through ${node}.`, "update", "Update distance", [next], [...settled], [], { distances: { ...distances }, visited: [...settled] }));
      }
    }
  }

  const path: string[] = [];
  if (Number.isFinite(distances[end])) {
    for (let at: string | undefined = end; at; at = previous[at]) {
      path.unshift(at);
      if (at === start) break;
    }
  }
  // Rebuild the answer hop by hop instead of just asserting it.
  for (let index = path.length - 1; index > 0; index--) {
    const hop = path.slice(index - 1);
    frames.push(snapshot(items, `${path[index]} was reached from ${path[index - 1]}.`, `Step back through the recorded predecessors: ${hop.join(" \u2192 ")}.`, "path", "Trace back", [path[index], path[index - 1]], [...settled], [], { distances: { ...distances }, path: hop, visited: [...settled] }));
  }
  const resolved = path.length > 1;
  frames.push(snapshot(items,
    resolved ? `Shortest path: ${path.join(" \u2192 ")}.` : `${end} is unreachable from ${start}.`,
    resolved ? `Total distance ${distances[end]}, along the highlighted edges.` : "No route exists in this graph.",
    "done", "Result", resolved ? path : [], [...settled], [], { distances, path, visited: [...settled] }));
  return frames;
}

function recursionTrace(algorithm: AlgorithmDefinition, raw: string) {
  const number = Math.max(1, Math.min(7, Number(raw) || 5));
  const stack: CubeItem[] = [], frames: SimFrame[] = [];
  if (algorithm.id === "factorial") {
    for (let value = number; value >= 1; value--) {
      stack.push({ id: `call-${value}`, label: `f(${value})`, value });
      const base = value === 1;
      frames.push(snapshot(stack, base ? "Reach the base case." : `Call factorial(${value - 1}).`, base ? "factorial(1) returns 1." : `${value} waits on the frame below it.`, base ? "base" : "recurse", base ? "Base case" : "Call", [stack.at(-1)!.id], [], [], { frontier: stack.map(item => item.label) }));
    }
    let result = 1;
    for (let value = 1; value <= number; value++) {
      result *= value; const active = stack.at(-1)?.id;
      frames.push(snapshot(stack, `Return ${result}.`, `Resolve ${value} × ${result / value}.`, "return", "Unwind", active ? [active] : [], [], [], { frontier: stack.map(item => item.label) }));
      stack.pop();
    }
  } else {
    return fibonacciTrace(number, stack, frames);
  }
  frames.push(snapshot([], "Recursion complete.", "The call stack is empty.", "done", "Complete"));
  return frames;
}

function fibonacciTrace(number: number, stack: CubeItem[], frames: SimFrame[]) {
  const calls = [number]; let serial = 0;
  while (calls.length && serial < 16) {
    const value = calls.pop()!;
    const item = { id: `call-${serial++}`, label: `fib(${value})`, value };
    stack.push(item);
    const base = value <= 1;
    frames.push(snapshot(stack, base ? `Base case returns ${value}.` : `Expand fib(${value}).`, base ? "This branch stops." : `Create fib(${value - 1}) and fib(${value - 2}).`, base ? "base" : "recurse", base ? "Base case" : "Expand", [item.id], [], [], { frontier: stack.map(entry => entry.label) }));
    if (value > 1) calls.push(value - 2, value - 1);
  }
  frames.push(snapshot([], "Recursion tree explored.", "The sampled call stack is complete.", "done", "Complete"));
  return frames;
}

export function buildSimulation(algorithm: AlgorithmDefinition, raw: string, variant: string): SimFrame[] {
  if (algorithm.id === "linear-search") return linearTrace(raw);
  if (algorithm.id === "binary-search") return binaryTrace(raw);
  if (algorithm.id === "bubble-sort") return bubbleTrace(raw);
  if (algorithm.id === "insertion-sort") return insertionTrace(raw);
  if (algorithm.id === "merge-sort") return mergeTrace(raw);
  if (algorithm.id === "quick-sort") return quickTrace(raw);
  if (algorithm.structure === "tree") return treeTrace(algorithm, raw, variant);
  if (algorithm.structure === "graph") return graphTrace(algorithm, raw);
  return recursionTrace(algorithm, raw);
}
