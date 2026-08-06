import type { RawSamples } from "./sample";

export const searchSamples: RawSamples = {
  "linear-search": {
    typescript: `
§setup§function linearSearch(values: number[], target: number): number {
§inspect§  for (let index = 0; index < values.length; index++) {
§compare§    if (values[index] === target) {
§match§      return index;
    }
  }
§missing§  return -1;
}`,
    python: `
§setup§def linear_search(values, target):
§inspect§    for index, value in enumerate(values):
§compare§        if value == target:
§match§            return index
§missing§    return -1`,
    go: `
§setup§func linearSearch(values []int, target int) int {
§inspect§    for index, value := range values {
§compare§        if value == target {
§match§            return index
        }
    }
§missing§    return -1
}`,
    java: `
§setup§static int linearSearch(int[] values, int target) {
§inspect§    for (int index = 0; index < values.length; index++) {
§compare§        if (values[index] == target) {
§match§            return index;
        }
    }
§missing§    return -1;
}`,
  },
  "binary-search": {
    typescript: `
§setup§function binarySearch(values: number[], target: number): number {
  let low = 0;
  let high = values.length - 1;
§inspect§  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
§compare§    if (values[middle] === target) return middle;
§discard§    if (values[middle] < target) low = middle + 1;
    else high = middle - 1;
  }
§missing§  return -1;
}`,
    python: `
§setup§def binary_search(values, target):
    low, high = 0, len(values) - 1
§inspect§    while low <= high:
        middle = (low + high) // 2
§compare§        if values[middle] == target:
            return middle
§discard§        if values[middle] < target:
            low = middle + 1
        else:
            high = middle - 1
§missing§    return -1`,
    go: `
§setup§func binarySearch(values []int, target int) int {
    low, high := 0, len(values)-1
§inspect§    for low <= high {
        middle := (low + high) / 2
§compare§        if values[middle] == target { return middle }
§discard§        if values[middle] < target {
            low = middle + 1
        } else {
            high = middle - 1
        }
    }
§missing§    return -1
}`,
    java: `
§setup§static int binarySearch(int[] values, int target) {
    int low = 0, high = values.length - 1;
§inspect§    while (low <= high) {
        int middle = (low + high) / 2;
§compare§        if (values[middle] == target) return middle;
§discard§        if (values[middle] < target) low = middle + 1;
        else high = middle - 1;
    }
§missing§    return -1;
}`,
  },
};
