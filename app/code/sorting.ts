import type { RawSamples } from "./sample";

export const sortingSamples: RawSamples = {
  "bubble-sort": {
    typescript: `
§setup§function bubbleSort(values: number[]): number[] {
§pass§  for (let end = values.length - 1; end > 0; end--) {
    for (let index = 0; index < end; index++) {
§compare§      if (values[index] > values[index + 1]) {
§swap§        [values[index], values[index + 1]] = [values[index + 1], values[index]];
      }
    }
  }
§done§  return values;
}`,
    python: `
§setup§def bubble_sort(values):
§pass§    for end in range(len(values) - 1, 0, -1):
        for index in range(end):
§compare§            if values[index] > values[index + 1]:
§swap§                values[index], values[index + 1] = values[index + 1], values[index]
§done§    return values`,
    go: `
§setup§func bubbleSort(values []int) []int {
§pass§    for end := len(values) - 1; end > 0; end-- {
        for index := 0; index < end; index++ {
§compare§            if values[index] > values[index+1] {
§swap§                values[index], values[index+1] = values[index+1], values[index]
            }
        }
    }
§done§    return values
}`,
    java: `
§setup§static int[] bubbleSort(int[] values) {
§pass§    for (int end = values.length - 1; end > 0; end--) {
        for (int index = 0; index < end; index++) {
§compare§            if (values[index] > values[index + 1]) {
§swap§                int held = values[index];
§swap§                values[index] = values[index + 1];
§swap§                values[index + 1] = held;
            }
        }
    }
§done§    return values;
}`,
  },
  "insertion-sort": {
    typescript: `
§setup§function insertionSort(values: number[]): number[] {
  for (let index = 1; index < values.length; index++) {
§select§    const key = values[index];
    let cursor = index - 1;
§shift§    while (cursor >= 0 && values[cursor] > key) {
§shift§      values[cursor + 1] = values[cursor];
      cursor--;
    }
§insert§    values[cursor + 1] = key;
  }
§done§  return values;
}`,
    python: `
§setup§def insertion_sort(values):
    for index in range(1, len(values)):
§select§        key = values[index]
        cursor = index - 1
§shift§        while cursor >= 0 and values[cursor] > key:
§shift§            values[cursor + 1] = values[cursor]
            cursor -= 1
§insert§        values[cursor + 1] = key
§done§    return values`,
    go: `
§setup§func insertionSort(values []int) []int {
    for index := 1; index < len(values); index++ {
§select§        key := values[index]
        cursor := index - 1
§shift§        for cursor >= 0 && values[cursor] > key {
§shift§            values[cursor+1] = values[cursor]
            cursor--
        }
§insert§        values[cursor+1] = key
    }
§done§    return values
}`,
    java: `
§setup§static int[] insertionSort(int[] values) {
    for (int index = 1; index < values.length; index++) {
§select§        int key = values[index];
        int cursor = index - 1;
§shift§        while (cursor >= 0 && values[cursor] > key) {
§shift§            values[cursor + 1] = values[cursor];
            cursor--;
        }
§insert§        values[cursor + 1] = key;
    }
§done§    return values;
}`,
  },
  "merge-sort": {
    typescript: `
§setup§function mergeSort(values: number[]): number[] {
§base§  if (values.length < 2) return values;
§split§  const middle = Math.floor(values.length / 2);
§split§  const left = mergeSort(values.slice(0, middle));
§split§  const right = mergeSort(values.slice(middle));
  const merged: number[] = [];
  while (left.length && right.length) {
§compare§    const takeLeft = left[0] <= right[0];
§merge§    merged.push(takeLeft ? left.shift()! : right.shift()!);
  }
§merge§  merged.push(...left, ...right);
§done§  return merged;
}`,
    python: `
§setup§def merge_sort(values):
§base§    if len(values) < 2:
§base§        return values
§split§    middle = len(values) // 2
§split§    left = merge_sort(values[:middle])
§split§    right = merge_sort(values[middle:])
    merged = []
    while left and right:
§compare§        take_left = left[0] <= right[0]
§merge§        merged.append(left.pop(0) if take_left else right.pop(0))
§merge§    merged.extend(left + right)
§done§    return merged`,
    go: `
§setup§func mergeSort(values []int) []int {
§base§    if len(values) < 2 {
§base§        return values
    }
§split§    middle := len(values) / 2
§split§    left := mergeSort(append([]int{}, values[:middle]...))
§split§    right := mergeSort(append([]int{}, values[middle:]...))
    merged := []int{}
    for len(left) > 0 && len(right) > 0 {
§compare§        takeLeft := left[0] <= right[0]
§merge§        if takeLeft {
§merge§            merged = append(merged, left[0])
§merge§            left = left[1:]
        } else {
§merge§            merged = append(merged, right[0])
§merge§            right = right[1:]
        }
    }
§merge§    merged = append(merged, left...)
§merge§    merged = append(merged, right...)
§done§    return merged
}`,
    java: `
§setup§static List<Integer> mergeSort(List<Integer> values) {
§base§    if (values.size() < 2) return values;
§split§    int middle = values.size() / 2;
§split§    List<Integer> left = mergeSort(new ArrayList<>(values.subList(0, middle)));
§split§    List<Integer> right = mergeSort(new ArrayList<>(values.subList(middle, values.size())));
    List<Integer> merged = new ArrayList<>();
    while (!left.isEmpty() && !right.isEmpty()) {
§compare§        boolean takeLeft = left.get(0) <= right.get(0);
§merge§        merged.add(takeLeft ? left.remove(0) : right.remove(0));
    }
§merge§    merged.addAll(left);
§merge§    merged.addAll(right);
§done§    return merged;
}`,
  },
  "quick-sort": {
    typescript: `
§setup§function quickSort(values: number[], low = 0, high = values.length - 1): number[] {
  if (low >= high) return values;
§pivot§  const pivot = values[high];
§pivot§  let boundary = low;
  for (let scan = low; scan < high; scan++) {
§compare§    if (values[scan] <= pivot) {
§partition§      [values[scan], values[boundary]] = [values[boundary], values[scan]];
§partition§      boundary++;
    }
  }
§recurse§  [values[boundary], values[high]] = [values[high], values[boundary]];
§recurse§  quickSort(values, low, boundary - 1);
§recurse§  quickSort(values, boundary + 1, high);
§done§  return values;
}`,
    python: `
§setup§def quick_sort(values, low=0, high=None):
    if high is None:
        high = len(values) - 1
    if low >= high:
        return values
§pivot§    pivot = values[high]
§pivot§    boundary = low
    for scan in range(low, high):
§compare§        if values[scan] <= pivot:
§partition§            values[scan], values[boundary] = values[boundary], values[scan]
§partition§            boundary += 1
§recurse§    values[boundary], values[high] = values[high], values[boundary]
§recurse§    quick_sort(values, low, boundary - 1)
§recurse§    quick_sort(values, boundary + 1, high)
§done§    return values`,
    go: `
§setup§func quickSort(values []int, low, high int) []int {
    if low >= high {
        return values
    }
§pivot§    pivot := values[high]
§pivot§    boundary := low
    for scan := low; scan < high; scan++ {
§compare§        if values[scan] <= pivot {
§partition§            values[scan], values[boundary] = values[boundary], values[scan]
§partition§            boundary++
        }
    }
§recurse§    values[boundary], values[high] = values[high], values[boundary]
§recurse§    quickSort(values, low, boundary-1)
§recurse§    quickSort(values, boundary+1, high)
§done§    return values
}`,
    java: `
§setup§static int[] quickSort(int[] values, int low, int high) {
    if (low >= high) return values;
§pivot§    int pivot = values[high];
§pivot§    int boundary = low;
    for (int scan = low; scan < high; scan++) {
§compare§        if (values[scan] <= pivot) {
§partition§            int moved = values[scan];
§partition§            values[scan] = values[boundary];
§partition§            values[boundary] = moved;
§partition§            boundary++;
        }
    }
§recurse§    int placed = values[boundary];
§recurse§    values[boundary] = values[high];
§recurse§    values[high] = placed;
§recurse§    quickSort(values, low, boundary - 1);
§recurse§    quickSort(values, boundary + 1, high);
§done§    return values;
}`,
  },
};
