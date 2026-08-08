import type { RawSamples } from "./sample";

export const treeSamples: RawSamples = {
  "tree-traversals": {
    typescript: `
§setup§function walk(node: TreeNode | null, order: string, out: number[]) {
§done§  if (!node) return;
§visit-pre§  if (order === "pre") out.push(node.value);
  walk(node.left, order, out);
§visit-in§  if (order === "in") out.push(node.value);
  walk(node.right, order, out);
§visit-post§  if (order === "post") out.push(node.value);
}`,
    python: `
§setup§def walk(node, order, out):
§done§    if node is None:
        return
§visit-pre§    if order == "pre":
        out.append(node.value)
    walk(node.left, order, out)
§visit-in§    if order == "in":
        out.append(node.value)
    walk(node.right, order, out)
§visit-post§    if order == "post":
        out.append(node.value)`,
    go: `
§setup§func walk(node *TreeNode, order string, out *[]int) {
§done§    if node == nil {
        return
    }
§visit-pre§    if order == "pre" {
        *out = append(*out, node.Value)
    }
    walk(node.Left, order, out)
§visit-in§    if order == "in" {
        *out = append(*out, node.Value)
    }
    walk(node.Right, order, out)
§visit-post§    if order == "post" {
        *out = append(*out, node.Value)
    }
}`,
    java: `
§setup§static void walk(TreeNode node, String order, List<Integer> out) {
§done§    if (node == null) return;
§visit-pre§    if (order.equals("pre")) out.add(node.value);
    walk(node.left, order, out);
§visit-in§    if (order.equals("in")) out.add(node.value);
    walk(node.right, order, out);
§visit-post§    if (order.equals("post")) out.add(node.value);
}`,
  },
  "bst-operations": {
    typescript: `
§setup§function search(node: TreeNode | null, key: number): TreeNode | null {
§done§  if (!node || node.value === key) return node;
§visit§  if (key < node.value) return search(node.left, key);
§visit§  return search(node.right, key);
}`,
    python: `
§setup§def search(node, key):
§done§    if node is None or node.value == key:
        return node
§visit§    if key < node.value:
§visit§        return search(node.left, key)
§visit§    return search(node.right, key)`,
    go: `
§setup§func search(node *TreeNode, key int) *TreeNode {
§done§    if node == nil || node.Value == key {
        return node
    }
§visit§    if key < node.Value {
§visit§        return search(node.Left, key)
    }
§visit§    return search(node.Right, key)
}`,
    java: `
§setup§static TreeNode search(TreeNode node, int key) {
§done§    if (node == null || node.value == key) return node;
§visit§    if (key < node.value) return search(node.left, key);
§visit§    return search(node.right, key);
}`,
  },
};
