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
§setup§function dijkstra(graph: WeightedGraph, start: string): Map<string, number> {
§setup§  const distance = new Map(graph.nodes.map(node => [node, Infinity]));
§setup§  distance.set(start, 0);
  const pending = new Set(graph.nodes);
  while (pending.size) {
§settle§    const node = [...pending].reduce((a, b) => distance.get(a)! <= distance.get(b)! ? a : b);
§settle§    pending.delete(node);
    for (const [next, weight] of graph.edges.get(node) ?? []) {
§relax§      const candidate = distance.get(node)! + weight;
§update§      if (candidate < distance.get(next)!) distance.set(next, candidate);
    }
  }
§done§  return distance;
}`,
    python: `
§setup§def dijkstra(graph, start):
§setup§    distance = {node: float("inf") for node in graph}
§setup§    distance[start] = 0
    pending = set(graph)
    while pending:
§settle§        node = min(pending, key=distance.get)
§settle§        pending.remove(node)
        for neighbor, weight in graph[node]:
§relax§            candidate = distance[node] + weight
§update§            if candidate < distance[neighbor]:
§update§                distance[neighbor] = candidate
§done§    return distance`,
    go: `
§setup§func dijkstra(graph map[string][]Edge, start string) map[string]int {
§setup§    distance := map[string]int{}
§setup§    pending := map[string]bool{}
§setup§    for node := range graph {
§setup§        distance[node] = math.MaxInt
§setup§        pending[node] = true
    }
§setup§    distance[start] = 0
    for len(pending) > 0 {
§settle§        node := ""
§settle§        for candidate := range pending {
§settle§            if node == "" || distance[candidate] < distance[node] {
§settle§                node = candidate
            }
        }
§settle§        delete(pending, node)
        for _, edge := range graph[node] {
§relax§            candidate := distance[node] + edge.Weight
§update§            if candidate < distance[edge.To] {
§update§                distance[edge.To] = candidate
            }
        }
    }
§done§    return distance
}`,
    java: `
§setup§static Map<String, Integer> dijkstra(Map<String, List<Edge>> graph, String start) {
§setup§    Map<String, Integer> distance = new HashMap<>();
§setup§    for (String node : graph.keySet()) distance.put(node, Integer.MAX_VALUE);
§setup§    distance.put(start, 0);
    Set<String> pending = new HashSet<>(graph.keySet());
    while (!pending.isEmpty()) {
§settle§        String node = Collections.min(pending, Comparator.comparing(distance::get));
§settle§        pending.remove(node);
        for (Edge edge : graph.get(node)) {
§relax§            int candidate = distance.get(node) + edge.weight;
§update§            if (candidate < distance.get(edge.to)) distance.put(edge.to, candidate);
        }
    }
§done§    return distance;
}`,
  },
};
