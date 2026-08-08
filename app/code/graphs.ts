import type { RawSamples } from "./sample";

export const graphSamples: RawSamples = {
  bfs: {
    typescript: `
§setup§function bfs(graph: Map<string, string[]>, start: string): string[] {
§setup§  const queue = [start];
§setup§  const seen = new Set([start]);
  const out: string[] = [];
  while (queue.length) {
§dequeue§    const node = queue.shift()!;
§dequeue§    out.push(node);
    for (const next of graph.get(node) ?? []) {
      if (!seen.has(next)) {
§enqueue§        seen.add(next);
§enqueue§        queue.push(next);
      }
    }
  }
§done§  return out;
}`,
    python: `
§setup§def bfs(graph, start):
§setup§    queue = [start]
§setup§    seen = {start}
    out = []
    while queue:
§dequeue§        node = queue.pop(0)
§dequeue§        out.append(node)
        for neighbor in graph[node]:
            if neighbor not in seen:
§enqueue§                seen.add(neighbor)
§enqueue§                queue.append(neighbor)
§done§    return out`,
    go: `
§setup§func bfs(graph map[string][]string, start string) []string {
§setup§    queue := []string{start}
§setup§    seen := map[string]bool{start: true}
    out := []string{}
    for len(queue) > 0 {
§dequeue§        node := queue[0]
§dequeue§        queue = queue[1:]
§dequeue§        out = append(out, node)
        for _, neighbor := range graph[node] {
            if !seen[neighbor] {
§enqueue§                seen[neighbor] = true
§enqueue§                queue = append(queue, neighbor)
            }
        }
    }
§done§    return out
}`,
    java: `
§setup§static List<String> bfs(Map<String, List<String>> graph, String start) {
§setup§    Queue<String> queue = new ArrayDeque<>(List.of(start));
§setup§    Set<String> seen = new HashSet<>(List.of(start));
    List<String> out = new ArrayList<>();
    while (!queue.isEmpty()) {
§dequeue§        String node = queue.remove();
§dequeue§        out.add(node);
        for (String neighbor : graph.get(node)) {
§enqueue§            if (seen.add(neighbor)) queue.add(neighbor);
        }
    }
§done§    return out;
}`,
  },
  dfs: {
    typescript: `
§setup§function dfs(graph: Map<string, string[]>, start: string): string[] {
§setup§  const stack = [start];
§setup§  const seen = new Set([start]);
  const out: string[] = [];
  while (stack.length) {
§pop§    const node = stack.pop()!;
§pop§    out.push(node);
    for (const next of [...(graph.get(node) ?? [])].reverse()) {
      if (!seen.has(next)) {
§push§        seen.add(next);
§push§        stack.push(next);
      }
    }
  }
§done§  return out;
}`,
    python: `
§setup§def dfs(graph, start):
§setup§    stack = [start]
§setup§    seen = {start}
    out = []
    while stack:
§pop§        node = stack.pop()
§pop§        out.append(node)
        for neighbor in reversed(graph[node]):
            if neighbor not in seen:
§push§                seen.add(neighbor)
§push§                stack.append(neighbor)
§done§    return out`,
    go: `
§setup§func dfs(graph map[string][]string, start string) []string {
§setup§    stack := []string{start}
§setup§    seen := map[string]bool{start: true}
    out := []string{}
    for len(stack) > 0 {
§pop§        node := stack[len(stack)-1]
§pop§        stack = stack[:len(stack)-1]
§pop§        out = append(out, node)
        neighbors := graph[node]
        for index := len(neighbors) - 1; index >= 0; index-- {
            if !seen[neighbors[index]] {
§push§                seen[neighbors[index]] = true
§push§                stack = append(stack, neighbors[index])
            }
        }
    }
§done§    return out
}`,
    java: `
§setup§static List<String> dfs(Map<String, List<String>> graph, String start) {
§setup§    Deque<String> stack = new ArrayDeque<>(List.of(start));
§setup§    Set<String> seen = new HashSet<>(List.of(start));
    List<String> out = new ArrayList<>();
    while (!stack.isEmpty()) {
§pop§        String node = stack.pop();
§pop§        out.add(node);
        List<String> neighbors = graph.get(node);
        for (int index = neighbors.size() - 1; index >= 0; index--) {
§push§            if (seen.add(neighbors.get(index))) stack.push(neighbors.get(index));
        }
    }
§done§    return out;
}`,
  },
  dijkstra: {
    typescript: `
§setup§function shortestPath(graph: WeightedGraph, start: string, target: string): string[] {
§setup§  const distance = new Map(graph.nodes.map(node => [node, Infinity]));
§setup§  const previous = new Map<string, string>();
§setup§  distance.set(start, 0);
  const pending = new Set(graph.nodes);
  while (pending.size) {
§settle§    const node = [...pending].reduce((a, b) => distance.get(a)! <= distance.get(b)! ? a : b);
§settle§    pending.delete(node);
§settle§    if (node === target) break;
    for (const [next, weight] of graph.edges.get(node) ?? []) {
§relax§      const candidate = distance.get(node)! + weight;
      if (candidate < distance.get(next)!) {
§update§        distance.set(next, candidate);
§update§        previous.set(next, node);
      }
    }
  }
  const path: string[] = [];
§path§  for (let at = target; at; at = previous.get(at)!) path.unshift(at);
§done§  return path;
}`,
    python: `
§setup§def shortest_path(graph, start, target):
§setup§    distance = {node: float("inf") for node in graph}
§setup§    previous = {}
§setup§    distance[start] = 0
    pending = set(graph)
    while pending:
§settle§        node = min(pending, key=distance.get)
§settle§        pending.remove(node)
§settle§        if node == target:
§settle§            break
        for neighbor, weight in graph[node]:
§relax§            candidate = distance[node] + weight
            if candidate < distance[neighbor]:
§update§                distance[neighbor] = candidate
§update§                previous[neighbor] = node
    path = []
§path§    at = target
§path§    while at is not None:
§path§        path.insert(0, at)
§path§        at = previous.get(at)
§done§    return path`,
    go: `
§setup§func shortestPath(graph map[string][]Edge, start, target string) []string {
§setup§    distance := map[string]int{}
§setup§    previous := map[string]string{}
§setup§    pending := map[string]bool{}
§setup§    for node := range graph {
§setup§        distance[node] = math.MaxInt
§setup§        pending[node] = true
    }
§setup§    distance[start] = 0
    for len(pending) > 0 {
§settle§        node := closest(pending, distance)
§settle§        delete(pending, node)
§settle§        if node == target {
§settle§            break
        }
        for _, edge := range graph[node] {
§relax§            candidate := distance[node] + edge.Weight
            if candidate < distance[edge.To] {
§update§                distance[edge.To] = candidate
§update§                previous[edge.To] = node
            }
        }
    }
    path := []string{}
§path§    for at := target; at != ""; at = previous[at] {
§path§        path = append([]string{at}, path...)
    }
§done§    return path
}`,
    java: `
§setup§static List<String> shortestPath(Map<String, List<Edge>> graph, String start, String target) {
§setup§    Map<String, Integer> distance = new HashMap<>();
§setup§    Map<String, String> previous = new HashMap<>();
§setup§    for (String node : graph.keySet()) distance.put(node, Integer.MAX_VALUE);
§setup§    distance.put(start, 0);
    Set<String> pending = new HashSet<>(graph.keySet());
    while (!pending.isEmpty()) {
§settle§        String node = Collections.min(pending, Comparator.comparing(distance::get));
§settle§        pending.remove(node);
§settle§        if (node.equals(target)) break;
        for (Edge edge : graph.get(node)) {
§relax§            int candidate = distance.get(node) + edge.weight;
            if (candidate < distance.get(edge.to)) {
§update§                distance.put(edge.to, candidate);
§update§                previous.put(edge.to, node);
            }
        }
    }
    LinkedList<String> path = new LinkedList<>();
§path§    for (String at = target; at != null; at = previous.get(at)) path.addFirst(at);
§done§    return path;
}`,
  },
};
