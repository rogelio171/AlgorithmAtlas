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
  // Small corner annotation, e.g. a Dijkstra distance or a returned value.
  badge?: string;
  // Id of this cube's parent, drawn as a link (recursion call trees).
  parent?: string;
  // Marks a subtree the algorithm is computing for a second time.
  repeat?: boolean;
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
  // Total lanes (rows) and column span used across the whole trace, so the
  // stage sizes a tree once instead of letting it drift as the shape changes.
  lanes?: number;
  cols?: number;
};

// The drawing has to agree with the numbers: each edge is laid out at
// GRAPH_SCALE pixels per unit of weight, so a heavier edge is visibly longer.
// tests/code-sync.test.mjs pins that relationship.
export const GRAPH_SCALE = 44;

export const graphPositions: Record<string, { x: number; y: number }> = {
  A: { x: 212, y: 134 }, B: { x: 300, y: 52 }, C: { x: 374, y: 190 },
  D: { x: 598, y: 130 }, E: { x: 62, y: 150 }, F: { x: 315, y: 258 },
};

export const graphEdges: [string, string, number][] = [
  ["A", "B", 3], ["A", "C", 4], ["B", "D", 7], ["B", "E", 6],
  ["C", "D", 5], ["C", "E", 7], ["D", "F", 7], ["E", "F", 6],
];

// Where each weight label sits: [fraction along the edge, perpendicular
// offset]. Hand-checked so no label can be mistaken for a neighbouring edge.
export const graphLabelSpots: Record<string, [number, number]> = {
  "A-B": [0.5, 16], "A-C": [0.5, -24], "B-D": [0.42, -24], "B-E": [0.66, 24],
  "C-D": [0.34, -24], "C-E": [0.34, -16], "D-F": [0.5, -24], "E-F": [0.5, 24],
};

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
      // Land on a resolved frame: dropping the cube from `active` lets the
      // settled colour show, the way every other algorithm ends.
      frames.push(snapshot(items, `${target} found at index ${index}.`, "The search is complete.", "match", "Complete", [], [id], ruledOut));
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
      frames.push(snapshot(items, `${target} found at index ${middle}.`, "The search is complete.", "match", "Complete", [], [items[middle].id], outside));
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
  const spread = frames.flatMap(frame => frame.items.map(item => item.col ?? 0));
  const cols = Math.max(1, Math.max(...spread) - Math.min(...spread));
  for (const frame of frames) { frame.lanes = lanes; frame.cols = cols; }
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
  // The queue Dijkstra actually picks from: reachable but not yet settled,
  // nearest first. Seeing it makes "settle the closest" a visible choice.
  const queue = () => graphNodes
    .filter(node => !settled.has(node) && Number.isFinite(distances[node]))
    .sort((a, b) => distances[a] - distances[b])
    .map(node => `${node} ${distances[node]}`);
  const frames = [snapshot(items, `Find the shortest path ${start} \u2192 ${end}.`, `${start} starts at 0; every other cube starts at \u221e.`, "setup", "Initialize", [start], [], [], { distances: { ...distances }, frontier: queue() })];

  while (settled.size < graphNodes.length) {
    const node = graphNodes.filter(candidate => !settled.has(candidate)).sort((a, b) => distances[a] - distances[b])[0];
    if (!node || !Number.isFinite(distances[node])) break;
    settled.add(node);
    stamp();
    frames.push(snapshot(items, `Settle ${node} at distance ${distances[node]}.`, node === end ? `${end} is settled, so its distance is final.` : "This is the closest unsettled cube; its distance can no longer improve.", "settle", "Settle", [node], [...settled], [], { distances: { ...distances }, visited: [...settled], frontier: queue() }));
    if (node === end) break;
    for (const [next, weight] of adjacency[node]) {
      if (settled.has(next)) continue;
      const candidate = distances[node] + weight;
      frames.push(snapshot(items, `Test ${node} \u2192 ${next} (${weight}).`, `Candidate: ${distances[node]} + ${weight} = ${candidate} vs ${Number.isFinite(distances[next]) ? distances[next] : "\u221e"}.`, "relax", "Relax edge", [node, next], [...settled], [], { distances: { ...distances }, visited: [...settled], frontier: queue() }));
      if (candidate < distances[next]) {
        distances[next] = candidate;
        previous[next] = node;
        stamp();
        frames.push(snapshot(items, `Update ${next} to ${candidate}.`, `A shorter route reaches ${next} through ${node}.`, "update", "Update distance", [next], [...settled], [], { distances: { ...distances }, visited: [...settled], frontier: queue() }));
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
  // Stopping at the target leaves cubes the search never needed. Dim them so
  // the ending reads as deliberate pruning rather than an unfinished run.
  const skipped = graphNodes.filter(node => !settled.has(node));
  // Rebuild the answer hop by hop instead of just asserting it.
  for (let index = path.length - 1; index > 0; index--) {
    const hop = path.slice(index - 1);
    frames.push(snapshot(items, `${path[index]} was reached from ${path[index - 1]}.`, `Step back through the recorded predecessors: ${hop.join(" \u2192 ")}.`, "path", "Trace back", [path[index], path[index - 1]], [...settled], skipped, { distances: { ...distances }, path: hop, visited: [...settled] }));
  }
  const resolved = path.length > 1;
  const pruned = skipped.length
    ? ` Stopped as soon as ${end} settled, so ${skipped.join(", ")} never had to be explored.`
    : "";
  frames.push(snapshot(items,
    resolved ? `Shortest path: ${path.join(" \u2192 ")}.` : `${end} is unreachable from ${start}.`,
    resolved
      ? `Total distance ${distances[end]} along the highlighted edges.${pruned}`
      : "No route exists in this graph.",
    "done", "Result", resolved ? path : [], [...settled], skipped, { distances, path, visited: [...settled] }));
  return frames;
}

function factorialTrace(raw: string) {
  const n = Math.max(1, Math.min(7, Number(raw) || 5));
  const cubes: CubeItem[] = [];
  const frames: SimFrame[] = [];
  const shot = (message: string, detail: string, codeKey: string, phase: string, active: string[], settled: string[]) =>
    frames.push(snapshot(cubes, message, detail, codeKey, phase, active, settled, [], { frontier: cubes.map(cube => cube.label) }));

  // Descend: one frame per call, each suspended until the one below returns.
  for (let value = n; value >= 1; value--) {
    const id = `call-${value}`;
    cubes.push({ id, label: `f(${value})`, value, lane: n - value, col: 0 });
    if (value === 1) {
      shot("Reach the base case.", "factorial(1) returns 1 without recursing further.", "base", "Base case", [id], []);
    } else {
      shot(`factorial(${value}) calls factorial(${value - 1}).`, "This frame is suspended until the call below returns.",
        value === n ? "setup" : "recurse", "Call", [id], []);
    }
  }

  // Unwind: each frame resolves and keeps its returned value on screen.
  let result = 1;
  const settled: string[] = [];
  for (let value = 1; value <= n; value++) {
    result *= value;
    const cube = cubes.find(item => item.id === `call-${value}`)!;
    cube.badge = String(result);
    settled.push(cube.id);
    shot(
      value === 1 ? "factorial(1) = 1." : `factorial(${value}) = ${value} × ${result / value} = ${result}.`,
      value === n ? "The outermost frame now holds the answer." : `Return ${result} up to factorial(${value + 1}).`,
      "return", "Return", [cube.id], [...settled],
    );
  }
  shot(`factorial(${n}) = ${result}.`, "Every frame resolved, and the answer stays on the stack.", "done", "Complete", [], [...settled]);

  for (const frame of frames) { frame.lanes = n; frame.cols = 1; }
  return frames;
}

type CallNode = { id: string; value: number; depth: number; parent?: string; kids: CallNode[]; x: number; result: number };

function fibonacciTrace(raw: string) {
  const n = Math.max(1, Math.min(6, Number(raw) || 5));
  let serial = 0;
  const nodes: CallNode[] = [];
  const build = (value: number, depth: number, parent?: string): CallNode => {
    const node: CallNode = { id: `call-${serial++}`, value, depth, parent, kids: [], x: 0, result: 0 };
    nodes.push(node);
    if (value > 1) node.kids.push(build(value - 1, depth + 1, node.id), build(value - 2, depth + 1, node.id));
    return node;
  };
  const root = build(n, 0);

  // Classic tree layout: each leaf takes the next column, each parent centres
  // over its two children.
  let leaf = 0;
  const place = (node: CallNode) => {
    if (!node.kids.length) { node.x = leaf++; return; }
    node.kids.forEach(place);
    node.x = (node.kids[0].x + node.kids[1].x) / 2;
  };
  place(root);

  const cubes: CubeItem[] = nodes.map(node => ({
    id: node.id, label: `f(${node.value})`, value: node.value,
    lane: node.depth, col: node.x, parent: node.parent,
  }));
  const byId = new Map(cubes.map(cube => [cube.id, cube]));
  const frames: SimFrame[] = [];
  const pending = new Set(cubes.map(cube => cube.id));
  const settled: string[] = [];
  const stack: string[] = [];
  const seen = new Map<number, number>();
  let repeats = 0;
  const shot = (message: string, detail: string, codeKey: string, phase: string, active: string[]) =>
    frames.push(snapshot(cubes, message, detail, codeKey, phase, active, [...settled], [...pending], { frontier: [...stack] }));

  shot(`Compute fib(${n}) by recursion.`, "The call tree stays dimmed until each call is actually made.", "setup", "Initialize", []);

  const walk = (node: CallNode) => {
    pending.delete(node.id);
    stack.push(`f(${node.value})`);
    const times = (seen.get(node.value) ?? 0) + 1;
    seen.set(node.value, times);
    const repeated = times > 1 && node.value > 1;
    if (repeated) { byId.get(node.id)!.repeat = true; repeats++; }

    if (node.value > 1) {
      shot(
        repeated ? `fib(${node.value}) again — already computed once.` : `Call fib(${node.value}).`,
        repeated ? "This whole subtree is recomputed from scratch." : `It needs fib(${node.value - 1}) and fib(${node.value - 2}).`,
        "recurse", repeated ? "Repeated work" : "Call", [node.id],
      );
      walk(node.kids[0]);
      walk(node.kids[1]);
      node.result = node.kids[0].result + node.kids[1].result;
    } else {
      node.result = node.value;
    }

    byId.get(node.id)!.badge = String(node.result);
    settled.push(node.id);
    shot(
      node.value <= 1 ? `fib(${node.value}) is a base case; return ${node.result}.` : `fib(${node.value}) returns ${node.result}.`,
      node.value <= 1 ? "A base case stops the recursion on this branch." : `${node.kids[0].result} + ${node.kids[1].result} = ${node.result}.`,
      node.value <= 1 ? "base" : "return",
      node.value <= 1 ? "Base case" : "Return",
      [node.id],
    );
    // Popped only after the frame is drawn, so a returning call is still shown
    // on the stack at the moment it returns — the way a debugger shows it.
    stack.pop();
  };
  walk(root);

  shot(
    `fib(${n}) = ${root.result}.`,
    repeats
      ? `${nodes.length} calls for ${n + 1} distinct values — ${repeats} subtree${repeats === 1 ? "" : "s"} recomputed.`
      : "The call tree is fully resolved.",
    "done", "Complete", [],
  );

  const lanes = Math.max(...nodes.map(node => node.depth)) + 1;
  for (const frame of frames) { frame.lanes = lanes; frame.cols = Math.max(1, leaf - 1); }
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
  if (algorithm.id === "factorial") return factorialTrace(raw);
  return fibonacciTrace(raw);
}
