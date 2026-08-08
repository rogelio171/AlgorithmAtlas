import type { RawSamples } from "./sample";

export const searchSamples: RawSamples = {
  "linear-search": {
    typescript: `
§setup§function linearSearch(values: number[], target: number): number {
§advance§  for (let index = 0; index < values.length; index++) {
§compare§    if (values[index] === target) {
§match§      return index;
    }
  }
§missing§  return -1;
}`,
    python: `
§setup§def linear_search(values, target):
§advance§    for index, value in enumerate(values):
§compare§        if value == target:
§match§            return index
§missing§    return -1`,
    go: `
§setup§func linearSearch(values []int, target int) int {
§advance§    for index, value := range values {
§compare§        if value == target {
§match§            return index
        }
    }
§missing§    return -1
}`,
    java: `
§setup§static int linearSearch(int[] values, int target) {
§advance§    for (int index = 0; index < values.length; index++) {
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
§setup§  let low = 0;
§setup§  let high = values.length - 1;
  while (low <= high) {
§probe§    const middle = Math.floor((low + high) / 2);
§probe§    if (values[middle] === target) {
§match§      return middle;
    }
§discard§    if (values[middle] < target) low = middle + 1;
§discard§    else high = middle - 1;
  }
§missing§  return -1;
}`,
    python: `
§setup§def binary_search(values, target):
§setup§    low, high = 0, len(values) - 1
    while low <= high:
§probe§        middle = (low + high) // 2
§probe§        if values[middle] == target:
§match§            return middle
§discard§        if values[middle] < target:
§discard§            low = middle + 1
        else:
§discard§            high = middle - 1
§missing§    return -1`,
    go: `
§setup§func binarySearch(values []int, target int) int {
§setup§    low, high := 0, len(values)-1
    for low <= high {
§probe§        middle := (low + high) / 2
§probe§        if values[middle] == target {
§match§            return middle
        }
§discard§        if values[middle] < target {
§discard§            low = middle + 1
        } else {
§discard§            high = middle - 1
        }
    }
§missing§    return -1
}`,
    java: `
§setup§static int binarySearch(int[] values, int target) {
§setup§    int low = 0, high = values.length - 1;
    while (low <= high) {
§probe§        int middle = (low + high) / 2;
§probe§        if (values[middle] == target) {
§match§            return middle;
        }
§discard§        if (values[middle] < target) low = middle + 1;
§discard§        else high = middle - 1;
    }
§missing§    return -1;
}`,
  },
};
