import type { RawSamples } from "./sample";

export const recursionSamples: RawSamples = {
  factorial: {
    typescript: `
§setup§function factorial(n: number): number {
§base§  if (n <= 1) return 1;
§recurse§  const smaller = factorial(n - 1);
§return,done§  return n * smaller;
}`,
    python: `
§setup§def factorial(n):
§base§    if n <= 1:
§base§        return 1
§recurse§    smaller = factorial(n - 1)
§return,done§    return n * smaller`,
    go: `
§setup§func factorial(n int) int {
§base§    if n <= 1 {
§base§        return 1
    }
§recurse§    smaller := factorial(n - 1)
§return,done§    return n * smaller
}`,
    java: `
§setup§static int factorial(int n) {
§base§    if (n <= 1) return 1;
§recurse§    int smaller = factorial(n - 1);
§return,done§    return n * smaller;
}`,
  },
  fibonacci: {
    typescript: `
§setup§function fibonacci(n: number): number {
§base§  if (n <= 1) return n;
§recurse,return,done§  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
    python: `
§setup§def fibonacci(n):
§base§    if n <= 1:
§base§        return n
§recurse,return,done§    return fibonacci(n - 1) + fibonacci(n - 2)`,
    go: `
§setup§func fibonacci(n int) int {
§base§    if n <= 1 {
§base§        return n
    }
§recurse,return,done§    return fibonacci(n - 1) + fibonacci(n - 2)
}`,
    java: `
§setup§static int fibonacci(int n) {
§base§    if (n <= 1) return n;
§recurse,return,done§    return fibonacci(n - 1) + fibonacci(n - 2);
}`,
  },
};
