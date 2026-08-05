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
defaultInput:"A | F",presets:[{"label":"A → F","value":"A | F"},{"label":"B → E","value":"B | E"},{"label":"C → F","value":"C | F"}],
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
const snippets={} as Record<string,Record<Language,string>>;
snippets["linear-search"]={} as Record<Language,string>;
snippets["linear-search"].typescript=
"function search(a:number[],t:number){\n for(let i=0;i<a.length;i++) if(a[i]===t)return i;\n return -1;\n}";
snippets["linear-search"].python=
"def search(a,t):\n for i,v in enumerate(a):\n  if v==t:return i\n return -1";
snippets["linear-search"].go=
"func search(a []int,t int)int{\n for i,v:=range a{if v==t{return i}}\n return -1\n}";
snippets["linear-search"].java=
"static int search(int[] a,int t){\n for(int i=0;i<a.length;i++)if(a[i]==t)return i;\n return -1;\n}";
snippets["binary-search"]={} as Record<Language,string>;
snippets["binary-search"].typescript=
"function search(a:number[],t:number){\n let l=0,h=a.length-1;\n while(l<=h){let m=(l+h)>>1;if(a[m]===t)return m;if(a[m]<t)l=m+1;else h=m-1}\n return -1;\n}";
snippets["binary-search"].python=
"def search(a,t):\n l,h=0,len(a)-1\n while l<=h:\n  m=(l+h)//2\n  if a[m]==t:return m\n  if a[m]<t:l=m+1\n  else:h=m-1\n return -1";
snippets["binary-search"].go=
"func search(a []int,t int)int{\n l,h:=0,len(a)-1\n for l<=h{m:=(l+h)/2;if a[m]==t{return m};if a[m]<t{l=m+1}else{h=m-1}}\n return -1\n}";
snippets["binary-search"].java=
"static int search(int[] a,int t){\n int l=0,h=a.length-1;\n while(l<=h){int m=(l+h)/2;if(a[m]==t)return m;if(a[m]<t)l=m+1;else h=m-1;}\n return -1;\n}";
snippets["bubble-sort"]={} as Record<Language,string>;
snippets["bubble-sort"].typescript=
"function sort(a:number[]){\n for(let e=a.length-1;e>0;e--)for(let i=0;i<e;i++)if(a[i]>a[i+1])[a[i],a[i+1]]=[a[i+1],a[i]];\n return a;\n}";
snippets["bubble-sort"].python=
"def sort(a):\n for e in range(len(a)-1,0,-1):\n  for i in range(e):\n   if a[i]>a[i+1]:a[i],a[i+1]=a[i+1],a[i]\n return a";
snippets["bubble-sort"].go=
"func sort(a []int)[]int{\n for e:=len(a)-1;e>0;e--{for i:=0;i<e;i++{if a[i]>a[i+1]{a[i],a[i+1]=a[i+1],a[i]}}}\n return a\n}";
snippets["bubble-sort"].java=
"static int[] sort(int[] a){\n for(int e=a.length-1;e>0;e--)for(int i=0;i<e;i++)if(a[i]>a[i+1]){int t=a[i];a[i]=a[i+1];a[i+1]=t;}\n return a;\n}";
snippets["insertion-sort"]={} as Record<Language,string>;
snippets["insertion-sort"].typescript=
"function sort(a:number[]){\n for(let i=1;i<a.length;i++){let k=a[i],j=i-1;while(j>=0&&a[j]>k){a[j+1]=a[j--]}a[j+1]=k}\n return a;\n}";
snippets["insertion-sort"].python=
"def sort(a):\n for i in range(1,len(a)):\n  k,j=a[i],i-1\n  while j>=0 and a[j]>k:a[j+1],j=a[j],j-1\n  a[j+1]=k\n return a";
snippets["insertion-sort"].go=
"func sort(a []int)[]int{\n for i:=1;i<len(a);i++{k,j:=a[i],i-1;for j>=0&&a[j]>k{a[j+1]=a[j];j--};a[j+1]=k}\n return a\n}";
snippets["insertion-sort"].java=
"static int[] sort(int[] a){\n for(int i=1;i<a.length;i++){int k=a[i],j=i-1;while(j>=0&&a[j]>k)a[j+1]=a[j--];a[j+1]=k;}\n return a;\n}";
snippets["merge-sort"]={} as Record<Language,string>;
snippets["merge-sort"].typescript=
"function sort(a:number[]):number[]{\n if(a.length<2)return a;let m=a.length>>1,l=sort(a.slice(0,m)),r=sort(a.slice(m)),o:number[]=[];\n while(l.length&&r.length)o.push(l[0]<=r[0]?l.s"
+"hift()!:r.shift()!);return [...o,...l,...r];\n}";
snippets["merge-sort"].python=
"def sort(a):\n if len(a)<2:return a\n m=len(a)//2;l,r=sort(a[:m]),sort(a[m:]);o=[]\n while l and r:o.append(l.pop(0) if l[0]<=r[0] else r.pop(0))\n return o+l+r";
snippets["merge-sort"].go=
"func sort(a []int)[]int{\n if len(a)<2{return a};m:=len(a)/2;l,r,o:=sort(a[:m]),sort(a[m:]),[]int{}\n for len(l)>0&&len(r)>0{if l[0]<=r[0]{o=append(o,l[0]);l=l[1:]}else{o=append(o,r["
+"0]);r=r[1:]}}\n return append(o,append(l,r...)...)\n}";
snippets["merge-sort"].java=
"static int[] sort(int[] a){\n if(a.length<2)return a;int m=a.length/2;\n return merge(sort(Arrays.copyOfRange(a,0,m)),sort(Arrays.copyOfRange(a,m,a.length)));\n}";
snippets["quick-sort"]={} as Record<Language,string>;
snippets["quick-sort"].typescript=
"function sort(a:number[],l=0,h=a.length-1){\n if(l>=h)return a;let p=l,v=a[h];for(let i=l;i<h;i++)if(a[i]<=v)[a[i],a[p]]=[a[p++],a[i]];\n [a[p],a[h]]=[a[h],a[p]];sort(a,l,p-1);sort(a"
+",p+1,h);return a;\n}";
snippets["quick-sort"].python=
"def sort(a,l=0,h=None):\n h=len(a)-1 if h is None else h\n if l>=h:return a\n p,v=l,a[h]\n for i in range(l,h):\n  if a[i]<=v:a[i],a[p],p=a[p],a[i],p+1\n a[p],a[h]=a[h],a[p];sort(a,l,p-1"
+");sort(a,p+1,h);return a";
snippets["quick-sort"].go=
"func sort(a []int,l,h int){\n if l>=h{return};p,v:=l,a[h];for i:=l;i<h;i++{if a[i]<=v{a[i],a[p]=a[p],a[i];p++}}\n a[p],a[h]=a[h],a[p];sort(a,l,p-1);sort(a,p+1,h)\n}";
snippets["quick-sort"].java=
"static void sort(int[] a,int l,int h){\n if(l>=h)return;int p=l,v=a[h];for(int i=l;i<h;i++)if(a[i]<=v){int t=a[i];a[i]=a[p];a[p++]=t;}\n int t=a[p];a[p]=a[h];a[h]=t;sort(a,l,p-1);sor"
+"t(a,p+1,h);\n}";
snippets["tree-traversals"]={} as Record<Language,string>;
snippets["tree-traversals"].typescript=
"function walk(n:Node|undefined,o:string,out:number[]){\n if(!n)return;if(o===\"pre\")out.push(n.value);walk(n.left,o,out);if(o===\"in\")out.push(n.value);walk(n.right,o,out);if(o===\"pos"
+"t\")out.push(n.value);\n}";
snippets["tree-traversals"].python=
"def walk(n,o,out):\n if n is None:return\n if o==\"pre\":out.append(n.value)\n walk(n.left,o,out)\n if o==\"in\":out.append(n.value)\n walk(n.right,o,out)\n if o==\"post\":out.append(n.value)";
snippets["tree-traversals"].go=
"func walk(n *Node,o string,out *[]int){\n if n==nil{return};if o==\"pre\"{*out=append(*out,n.Value)};walk(n.Left,o,out);if o==\"in\"{*out=append(*out,n.Value)};walk(n.Right,o,out);if o="
+"=\"post\"{*out=append(*out,n.Value)}\n}";
snippets["tree-traversals"].java=
"static void walk(Node n,String o,List<Integer> out){\n if(n==null)return;if(o.equals(\"pre\"))out.add(n.value);walk(n.left,o,out);if(o.equals(\"in\"))out.add(n.value);walk(n.right,o,out"
+");if(o.equals(\"post\"))out.add(n.value);\n}";
snippets["bst-operations"]={} as Record<Language,string>;
snippets["bst-operations"].typescript=
"function search(n:Node|undefined,k:number):Node|undefined{\n if(!n||n.value===k)return n;return k<n.value?search(n.left,k):search(n.right,k);\n}\nfunction insert(n:Node|undefined,k:nu"
+"mber):Node{\n if(!n)return{value:k};if(k<n.value)n.left=insert(n.left,k);else n.right=insert(n.right,k);return n;\n}";
snippets["bst-operations"].python=
"def search(n,k):\n if n is None or n.value==k:return n\n return search(n.left,k) if k<n.value else search(n.right,k)\ndef insert(n,k):\n if n is None:return Node(k)\n if k<n.value:n.lef"
+"t=insert(n.left,k)\n else:n.right=insert(n.right,k)\n return n";
snippets["bst-operations"].go=
"func search(n *Node,k int)*Node{if n==nil||n.Value==k{return n};if k<n.Value{return search(n.Left,k)};return search(n.Right,k)}\nfunc insert(n *Node,k int)*Node{if n==nil{return &No"
+"de{Value:k}};if k<n.Value{n.Left=insert(n.Left,k)}else{n.Right=insert(n.Right,k)};return n}";
snippets["bst-operations"].java=
"static Node search(Node n,int k){if(n==null||n.value==k)return n;return k<n.value?search(n.left,k):search(n.right,k);}\nstatic Node insert(Node n,int k){if(n==null)return new Node(k"
+");if(k<n.value)n.left=insert(n.left,k);else n.right=insert(n.right,k);return n;}";
snippets["bfs"]={} as Record<Language,string>;
snippets["bfs"].typescript=
"function bfs(g:Map<string,string[]>,s:string){\n let q=[s],seen=new Set(q),out:string[]=[];while(q.length){let n=q.shift()!;out.push(n);for(let x of g.get(n)??[])if(!seen.has(x)){se"
+"en.add(x);q.push(x)}}return out;\n}";
snippets["bfs"].python=
"def bfs(g,s):\n q,seen,out=[s],{s},[]\n while q:\n  n=q.pop(0);out.append(n)\n  for x in g[n]:\n   if x not in seen:seen.add(x);q.append(x)\n return out";
snippets["bfs"].go=
"func bfs(g map[string][]string,s string)[]string{q,seen,out:=[]string{s},map[string]bool{s:true},[]string{};for len(q)>0{n:=q[0];q=q[1:];out=append(out,n);for _,x:=range g[n]{if !s"
+"een[x]{seen[x]=true;q=append(q,x)}}};return out}";
snippets["bfs"].java=
"static List<String> bfs(Map<String,List<String>> g,String s){Queue<String>q=new ArrayDeque<>();q.add(s);Set<String>seen=new HashSet<>();seen.add(s);List<String>out=new ArrayList<>("
+");while(!q.isEmpty()){String n=q.remove();out.add(n);for(String x:g.get(n))if(seen.add(x))q.add(x);}return out;}";
snippets["dfs"]={} as Record<Language,string>;
snippets["dfs"].typescript=
"function dfs(g:Map<string,string[]>,s:string){\n let stack=[s],seen=new Set<string>(),out:string[]=[];while(stack.length){let n=stack.pop()!;if(seen.has(n))continue;seen.add(n);out."
+"push(n);stack.push(...(g.get(n)??[]))}return out;\n}";
snippets["dfs"].python=
"def dfs(g,s):\n stack,seen,out=[s],set(),[]\n while stack:\n  n=stack.pop()\n  if n in seen:continue\n  seen.add(n);out.append(n);stack.extend(g[n])\n return out";
snippets["dfs"].go=
"func dfs(g map[string][]string,s string)[]string{stack,seen,out:=[]string{s},map[string]bool{},[]string{};for len(stack)>0{n:=stack[len(stack)-1];stack=stack[:len(stack)-1];if seen"
+"[n]{continue};seen[n]=true;out=append(out,n);stack=append(stack,g[n]...)};return out}";
snippets["dfs"].java=
"static List<String> dfs(Map<String,List<String>>g,String s){Deque<String>stack=new ArrayDeque<>();stack.push(s);Set<String>seen=new HashSet<>();List<String>out=new ArrayList<>();wh"
+"ile(!stack.isEmpty()){String n=stack.pop();if(!seen.add(n))continue;out.add(n);for(String x:g.get(n))stack.push(x);}return out;}";
snippets["dijkstra"]={} as Record<Language,string>;
snippets["dijkstra"].typescript=
"function dijkstra(g:Graph,s:string){\n let d=new Map(g.nodes.map(n=>[n,Infinity]));d.set(s,0);let p=new Set(g.nodes);while(p.size){let n=[...p].reduce((a,b)=>d.get(a)!<d.get(b)!?a:b"
+");p.delete(n);for(let[x,w]of g.edges.get(n)??[])d.set(x,Math.min(d.get(x)!,d.get(n)!+w))}return d;\n}";
snippets["dijkstra"].python=
"def dijkstra(g,s):\n d={n:float(\"inf\") for n in g};d[s]=0;p=set(g)\n while p:\n  n=min(p,key=d.get);p.remove(n)\n  for x,w in g[n]:d[x]=min(d[x],d[n]+w)\n return d";
snippets["dijkstra"].go=
"func dijkstra(g Graph,s string)map[string]int{d,p:=distances(g,s),nodes(g);for len(p)>0{n:=closest(p,d);delete(p,n);for _,e:=range g[n]{v:=d[n]+e.Weight;if v<d[e.To]{d[e.To]=v}}};r"
+"eturn d}";
snippets["dijkstra"].java=
"static Map<String,Integer>dijkstra(Graph g,String s){Map<String,Integer>d=distances(g,s);Set<String>p=new HashSet<>(g.nodes());while(!p.isEmpty()){String n=closest(p,d);p.remove(n)"
+";for(Edge e:g.edges(n))d.put(e.to(),Math.min(d.get(e.to()),d.get(n)+e.weight()));}return d;}";
snippets["factorial"]={} as Record<Language,string>;
snippets["factorial"].typescript=
"function factorial(n:number):number{\n if(n<=1)return 1;return n*factorial(n-1);\n}";
snippets["factorial"].python=
"def factorial(n):\n if n<=1:return 1\n return n*factorial(n-1)";
snippets["factorial"].go=
"func factorial(n int)int{if n<=1{return 1};return n*factorial(n-1)}";
snippets["factorial"].java=
"static int factorial(int n){if(n<=1)return 1;return n*factorial(n-1);}";
snippets["fibonacci"]={} as Record<Language,string>;
snippets["fibonacci"].typescript=
"function fibonacci(n:number):number{\n if(n<=1)return n;return fibonacci(n-1)+fibonacci(n-2);\n}";
snippets["fibonacci"].python=
"def fibonacci(n):\n if n<=1:return n\n return fibonacci(n-1)+fibonacci(n-2)";
snippets["fibonacci"].go=
"func fibonacci(n int)int{if n<=1{return n};return fibonacci(n-1)+fibonacci(n-2)}";
snippets["fibonacci"].java=
"static int fibonacci(int n){if(n<=1)return n;return fibonacci(n-1)+fibonacci(n-2);}";
export function getCode(id:string,language:Language){return snippets[id][language]}
