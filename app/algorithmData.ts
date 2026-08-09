export type Language="typescript"|"python"|"go"|"java";
export type StructureKind="array"|"graph"|"tree"|"recursion";
export type AlgorithmDefinition={id:string;title:string;category:string;difficulty:string;summary:string;insight:string;time:string;space:string;structure:StructureKind;defaultInput:string;presets:{label:string;value:string}[];variants?:string[]};
export const languages=[{id:"typescript",label:"TypeScript"},{id:"python",label:"Python"},{id:"go",label:"Go"},{id:"java",label:"Java"}] as const;
export const algorithms:AlgorithmDefinition[]=[];
algorithms.push({
id:"linear-search",title:"Linear search",category:"Search",difficulty:"Beginner",structure:"array" as StructureKind,
summary:"Scan each value until the target is found.",insight:"Every skipped value is ruled out.",time:"O(n)",space:"O(1)",
defaultInput:"9, 3, 7, 1, 6 | 7",presets:[{"label":"Found","value":"9, 3, 7, 1, 6 | 7"},{"label":"First","value":"4, 8, 2, 5 | 4"},{"label":"Missing","value":"5, 2, 9, 1 | 7"}],
});
algorithms.push({
id:"binary-search",title:"Binary search",category:"Search",difficulty:"Beginner",structure:"array" as StructureKind,
summary:"Halve a sorted range around its midpoint.",insight:"The target stays inside the active interval.",time:"O(log n)",space:"O(1)",
defaultInput:"2, 5, 8, 12, 16, 23, 38 | 23",presets:[{"label":"Found","value":"2, 5, 8, 12, 16, 23, 38 | 23"},{"label":"Boundary","value":"1, 4, 9, 15, 21 | 1"},{"label":"Missing","value":"3, 7, 11, 18, 26 | 12"}],
});
algorithms.push({
id:"bubble-sort",title:"Bubble sort",category:"Sorting",difficulty:"Beginner",structure:"array" as StructureKind,
summary:"Swap adjacent inversions until large values settle.",insight:"Each pass fixes one suffix value.",time:"O(n²)",space:"O(1)",
defaultInput:"7, 3, 9, 2, 6",presets:[{"label":"Mixed","value":"7, 3, 9, 2, 6"},{"label":"Nearly sorted","value":"1, 2, 4, 3, 5"},{"label":"Reverse","value":"6, 5, 4, 3, 2"}],
});
algorithms.push({
id:"insertion-sort",title:"Insertion sort",category:"Sorting",difficulty:"Beginner",structure:"array" as StructureKind,
summary:"Insert each key into a growing sorted prefix.",insight:"The left prefix is always sorted.",time:"O(n²)",space:"O(1)",
defaultInput:"8, 4, 6, 2, 7",presets:[{"label":"Mixed","value":"8, 4, 6, 2, 7"},{"label":"Nearly sorted","value":"1, 3, 2, 4, 5"},{"label":"Duplicates","value":"4, 2, 4, 1, 2"}],
});
algorithms.push({
id:"merge-sort",title:"Merge sort",category:"Sorting",difficulty:"Intermediate",structure:"array" as StructureKind,
summary:"Split recursively, then merge sorted halves.",insight:"Each merge receives two sorted ranges.",time:"O(n log n)",space:"O(n)",
defaultInput:"9, 4, 7, 3, 8, 2",presets:[{"label":"Mixed","value":"9, 4, 7, 3, 8, 2"},{"label":"Odd length","value":"6, 1, 5, 2, 4"},{"label":"Duplicates","value":"3, 7, 3, 1, 7, 2"}],
});
algorithms.push({
id:"quick-sort",title:"Quick sort",category:"Sorting",difficulty:"Intermediate",structure:"array" as StructureKind,
summary:"Partition around a pivot and sort both sides.",insight:"A partitioned pivot is final.",time:"O(n log n) avg",space:"O(log n)",
defaultInput:"10, 4, 8, 3, 7, 5",presets:[{"label":"Mixed","value":"10, 4, 8, 3, 7, 5"},{"label":"Small","value":"4, 1, 3, 2"},{"label":"Duplicates","value":"5, 2, 5, 1, 3"}],
});
algorithms.push({
id:"tree-traversals",title:"Binary tree traversals",category:"Trees",difficulty:"Intermediate",structure:"tree" as StructureKind,
summary:"Visit nodes in preorder, inorder, or postorder.",insight:"Only the root visit position changes.",time:"O(n)",space:"O(h)",
defaultInput:"8, 4, 12, 2, 6, 10, 14",presets:[{"label":"Balanced","value":"8, 4, 12, 2, 6, 10, 14"},{"label":"Small","value":"5, 3, 7"},{"label":"Uneven","value":"9, 4, 13, 2, 6, 11"}],
variants:["Inorder","Preorder","Postorder"],});
algorithms.push({
id:"bst-operations",title:"Binary search tree operations",category:"Trees",difficulty:"Intermediate",structure:"tree" as StructureKind,
summary:"Search, insert, or delete while preserving order.",insight:"Each comparison discards one subtree.",time:"O(h)",space:"O(h)",
defaultInput:"8, 4, 12, 2, 6, 10, 14 | 6",presets:[{"label":"Search","value":"8, 4, 12, 2, 6, 10, 14 | 6"},{"label":"Insert","value":"8, 4, 12, 2, 6, 10 | 14"},{"label":"Delete","value":"8, 4, 12, 2, 6, 10, 14 | 4"}],
variants:["Search","Insert","Delete"],});
algorithms.push({
id:"bfs",title:"Breadth-first search",category:"Graphs",difficulty:"Intermediate",structure:"graph" as StructureKind,
summary:"Explore a graph level by level with a queue.",insight:"First visits are shortest in edge count.",time:"O(V + E)",space:"O(V)",
defaultInput:"A",presets:[{"label":"From A","value":"A"},{"label":"From C","value":"C"},{"label":"From F","value":"F"}],
});
algorithms.push({
id:"dfs",title:"Depth-first search",category:"Graphs",difficulty:"Intermediate",structure:"graph" as StructureKind,
summary:"Follow a branch deeply, then backtrack.",insight:"The stack keeps unfinished branches.",time:"O(V + E)",space:"O(V)",
defaultInput:"A",presets:[{"label":"From A","value":"A"},{"label":"From C","value":"C"},{"label":"From E","value":"E"}],
});
algorithms.push({
id:"dijkstra",title:"Dijkstra’s shortest path",category:"Graphs",difficulty:"Intermediate",structure:"graph" as StructureKind,
summary:"Settle the nearest node and relax its edges.",insight:"Settled distances are final.",time:"O((V + E) log V)",space:"O(V)",
defaultInput:"A | F",presets:[{"label":"A → F","value":"A | F"},{"label":"A → E","value":"A | E"},{"label":"C → F","value":"C | F"}],
});
algorithms.push({
id:"factorial",title:"Factorial recursion",category:"Recursion",difficulty:"Beginner",structure:"recursion" as StructureKind,
summary:"Reduce n! until the base case, then unwind.",insight:"Each frame waits for a smaller result.",time:"O(n)",space:"O(n)",
defaultInput:"5",presets:[{"label":"n = 5","value":"5"},{"label":"Base case","value":"1"},{"label":"n = 7","value":"7"}],
});
algorithms.push({
id:"fibonacci",title:"Fibonacci recursion",category:"Recursion",difficulty:"Intermediate",structure:"recursion" as StructureKind,
summary:"Expand into two smaller calls, then combine.",insight:"The tree exposes repeated work.",time:"O(2ⁿ)",space:"O(n)",
defaultInput:"5",presets:[{"label":"n = 5","value":"5"},{"label":"n = 3","value":"3"},{"label":"n = 6","value":"6"}],
});
export const categories=["All","Search","Sorting","Trees","Graphs","Recursion"] as const;
