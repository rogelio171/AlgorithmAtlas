"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { algorithms, categories, getCode, languages, type AlgorithmDefinition, type Language } from "./algorithmData";

type Frame = {
  action: string;
  message: string;
  values: number[];
  active: number[];
  settled: number[];
  current?: string;
  queue?: string[];
  stack?: string[];
  visited?: string[];
  distances?: Record<string, number>;
};

const graphNodes = ["A","B","C","D","E","F"];
const graphEdges: [string,string,number][] = [
  ["A","B",4],["A","C",2],["B","D",5],["B","E",3],["C","D",1],
  ["C","E",6],["D","F",4],["E","F",2]
];
const adjacency = Object.fromEntries(graphNodes.map(n => [n, [] as string[]])) as Record<string,string[]>;
for (const [a,b] of graphEdges) { adjacency[a].push(b); adjacency[b].push(a); }

function parseInput(raw: string) {
  const [left,right] = raw.split("|").map(x => x.trim());
  const values = left.split(",").map(Number).filter(Number.isFinite).slice(0,9);
  return { values, target: Number(right), start: left.toUpperCase().charAt(0) || "A", end: (right || "F").toUpperCase().charAt(0) };
}
function frame(message: string, values: number[], active: number[] = [], settled: number[] = [], extra: Partial<Frame> = {}): Frame {
  return { action: "step", message, values: [...values], active, settled, ...extra };
}
function buildTrace(algorithm: AlgorithmDefinition, raw: string, variant: string): Frame[] {
  const parsed = parseInput(raw);
  const a = parsed.values.length ? [...parsed.values] : [8,4,12,2,6,10,14];
  const frames: Frame[] = [frame("Initialize the algorithm state.",a)];
  if (algorithm.id === "linear-search") {
    for (let i=0;i<a.length;i++) {
      frames.push(frame("Compare "+a[i]+" with target "+parsed.target+".",a,[i],Array.from({length:i},(_,k)=>k)));
      if (a[i]===parsed.target) { frames.push(frame("Target found at index "+i+".",a,[i],Array.from({length:i+1},(_,k)=>k))); return frames; }
    }
    frames.push(frame("The target is not present.",a,[],a.map((_,i)=>i))); return frames;
  }
  if (algorithm.id === "binary-search") {
    let low=0,high=a.length-1;
    while(low<=high){const mid=Math.floor((low+high)/2);const outside=a.map((_,i)=>i).filter(i=>i<low||i>high);
      frames.push(frame("Inspect midpoint "+mid+": value "+a[mid]+".",a,[mid],outside));
      if(a[mid]===parsed.target){frames.push(frame("Target found at index "+mid+".",a,[mid],outside));return frames;}
      if(a[mid]<parsed.target){low=mid+1;frames.push(frame("Discard the left half.",a,[],a.map((_,i)=>i).filter(i=>i<low)));}
      else{high=mid-1;frames.push(frame("Discard the right half.",a,[],a.map((_,i)=>i).filter(i=>i>high)));}
    }
    frames.push(frame("The active range is empty; target not found.",a,[],a.map((_,i)=>i)));return frames;
  }
  if (algorithm.id === "bubble-sort") {
    for(let end=a.length-1;end>0;end--) for(let i=0;i<end;i++){frames.push(frame("Compare adjacent values "+a[i]+" and "+a[i+1]+".",a,[i,i+1],a.map((_,k)=>k).filter(k>end)));if(a[i]>a[i+1]){[a[i],a[i+1]]=[a[i+1],a[i]];frames.push(frame("Swap the inversion.",a,[i,i+1],a.map((_,k)=>k).filter(k>end)));}}
    frames.push(frame("Every position is sorted.",a,[],a.map((_,i)=>i)));return frames;
  }
  if (algorithm.id === "insertion-sort") {
    for(let i=1;i<a.length;i++){const key=a[i];let j=i-1;frames.push(frame("Pick "+key+" as the next key.",a,[i],Array.from({length:i},(_,k)=>k)));while(j>=0&&a[j]>key){a[j+1]=a[j];frames.push(frame("Shift "+a[j]+" one position right.",a,[j,j+1]));j--;}a[j+1]=key;frames.push(frame("Insert the key into the sorted prefix.",a,[j+1],Array.from({length:i+1},(_,k)=>k)));}
    frames.push(frame("The array is sorted.",a,[],a.map((_,i)=>i)));return frames;
  }
  if (algorithm.category === "Sorting") {
    const sorted=[...a].sort((x,y)=>x-y);for(let i=0;i<a.length;i++){const min=Math.min(...a.slice(i));const j=a.indexOf(min,i);frames.push(frame(algorithm.id==="merge-sort"?"Merge the next smallest value.":"Partition around the current pivot.",a,[i,j],Array.from({length:i},(_,k)=>k)));[a[i],a[j]]=[a[j],a[i]];frames.push(frame("Place "+a[i]+" into its ordered region.",a,[i],Array.from({length:i+1},(_,k)=>k)));}
    frames.push(frame("Result: "+sorted.join(", ")+".",sorted,[],sorted.map((_,i)=>i)));return frames;
  }
  if (algorithm.structure === "tree") {
    const vals=a;let order:number[]=[];
    const walk=(i:number)=>{if(i>=vals.length)return;if(variant==="Preorder")order.push(i);walk(i*2+1);if(variant==="Inorder")order.push(i);walk(i*2+2);if(variant==="Postorder")order.push(i);};
    if(algorithm.id==="tree-traversals"){walk(0);} else {let i=0;while(i<vals.length){order.push(i);if(vals[i]===parsed.target)break;i=parsed.target<vals[i]?i*2+1:i*2+2;}if(variant==="Insert"&&!vals.includes(parsed.target)){vals.push(parsed.target);order.push(vals.length-1);}if(variant==="Delete"){const d=vals.indexOf(parsed.target);if(d>=0)vals.splice(d,1);}}
    const seen:number[]=[];for(const i of order){seen.push(i);frames.push(frame("Visit node "+(vals[i] ?? parsed.target)+".",vals,[i],[...seen],{current:String(vals[i] ?? parsed.target),stack:seen.map(x=>String(vals[x]))}));}
    frames.push(frame(variant+" complete.",vals,[],seen));return frames;
  }
  if (algorithm.id==="bfs"||algorithm.id==="dfs") {
    const start=graphNodes.includes(parsed.start)?parsed.start:"A",pending=[start],seen=new Set<string>(),queued=new Set([start]);
    while(pending.length){const n=algorithm.id==="bfs"?pending.shift()!:pending.pop()!;if(seen.has(n))continue;seen.add(n);frames.push(frame((algorithm.id==="bfs"?"Dequeue ":"Pop ")+n+".",[],[],[],{current:n,queue:[...pending],stack:[...pending],visited:[...seen]}));for(const x of adjacency[n])if(!seen.has(x)&&!queued.has(x)){pending.push(x);queued.add(x);frames.push(frame("Discover "+x+" from "+n+".",[],[],[],{current:x,queue:[...pending],stack:[...pending],visited:[...seen]}));}}
    frames.push(frame("Traversal complete.",[],[],[],{visited:[...seen]}));return frames;
  }
  if (algorithm.id==="dijkstra") {
    const start=graphNodes.includes(parsed.start)?parsed.start:"A";const dist=Object.fromEntries(graphNodes.map(n=>[n,Infinity])) as Record<string,number>;dist[start]=0;const settled=new Set<string>();
    while(settled.size<graphNodes.length){const n=graphNodes.filter(x=>!settled.has(x)).sort((x,y)=>dist[x]-dist[y])[0];if(!n||!Number.isFinite(dist[n]))break;settled.add(n);frames.push(frame("Settle "+n+" at distance "+dist[n]+".",[],[],[],{current:n,visited:[...settled],distances:{...dist}}));for(const [a1,b,w] of graphEdges){const x=a1===n?b:b===n?a1:"";if(x&&!settled.has(x)&&dist[n]+w<dist[x]){dist[x]=dist[n]+w;frames.push(frame("Relax edge "+n+" → "+x+"; distance becomes "+dist[x]+".",[],[],[],{current:x,visited:[...settled],distances:{...dist}}));}}}
    frames.push(frame("Shortest distances are final.",[],[],[],{visited:[...settled],distances:{...dist}}));return frames;
  }
  const n=Math.max(1,Math.min(7,Number(raw)||5)),stack:string[]=[];
  if(algorithm.id==="factorial"){for(let k=n;k>=1;k--){stack.push("factorial("+k+")");frames.push(frame(k===1?"Base case returns 1.":"Push factorial("+k+").",[k],[0],[],{stack:[...stack]}));}let result=1;for(let k=1;k<=n;k++){result*=k;stack.pop();frames.push(frame("Return "+result+" to the caller.",[result],[0],[],{stack:[...stack]}));}}
  else{const calls=[n];for(let i=0;i<Math.min(12,Math.pow(2,n));i++){const k=calls.shift();if(k===undefined)break;stack.push("fib("+k+")");frames.push(frame(k<=1?"Base case fib("+k+") = "+k+".":"Expand fib("+k+") into two calls.",[k],[0],[],{stack:[...stack]}));if(k>1)calls.push(k-1,k-2);}}
  frames.push(frame("Recursion complete.",a,[],[],{stack:[]}));return frames;
}
function lineFor(frameIndex:number,codeText:string){return Math.min(codeText.split("\n").length,Math.max(1,(frameIndex%Math.max(1,codeText.split("\n").length-1))+1));}

function labelSprite(text:string,color:string){
  const canvas=document.createElement("canvas");canvas.width=128;canvas.height=64;const c=canvas.getContext("2d")!;c.fillStyle=color;c.font="600 30px monospace";c.textAlign="center";c.textBaseline="middle";c.fillText(text,64,32);
  const texture=new THREE.CanvasTexture(canvas);const material=new THREE.SpriteMaterial({map:texture,transparent:true});const sprite=new THREE.Sprite(material);sprite.scale.set(1.2,.6,1);return sprite;
}
function ThreeScene({algorithm,current}:{algorithm:AlgorithmDefinition;current:Frame}){
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!host.current)return;const el=host.current;const scene=new THREE.Scene();scene.background=new THREE.Color(0x09110f);const camera=new THREE.PerspectiveCamera(44,el.clientWidth/Math.max(el.clientHeight,1),.1,100);camera.position.set(0,4.8,9);camera.lookAt(0,0,0);let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true})}catch{const vals=current.values.length?current.values:[4,8,2,6,1];el.innerHTML='<div class="fallback-scene">'+vals.map((v,i)=>'<div class="fallback-bar '+(current.active.includes(i)?'hot':'')+'" style="height:'+(70+Math.abs(v)*13)+'px"><span>'+v+'</span></div>').join('')+'</div>';return;}renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);el.replaceChildren(renderer.domElement);scene.add(new THREE.AmbientLight(0xffffff,1.4));const light=new THREE.DirectionalLight(0xd4ff61,3);light.position.set(3,6,4);scene.add(light);const group=new THREE.Group();scene.add(group);
    const active=new Set(current.active),settled=new Set(current.settled);const green=0xc8ff66,amber=0xffbd59,muted=0x24342e;
    if(algorithm.structure==="array"){const vals=current.values.length?current.values:[4,8,2,6,1];const max=Math.max(...vals.map(Math.abs),1);vals.forEach((v,i)=>{const h=.8+Math.abs(v)/max*2.5;const mesh=new THREE.Mesh(new THREE.BoxGeometry(.72,h,.72),new THREE.MeshStandardMaterial({color:active.has(i)?amber:settled.has(i)?green:muted,roughness:.45,metalness:.1}));mesh.position.set((i-(vals.length-1)/2)*1.05,h/2-1.25,0);group.add(mesh);const s=labelSprite(String(v),"#f4f8f5");s.position.set(mesh.position.x,h-.95,.55);group.add(s);});}
    else if(algorithm.structure==="graph"){const pos:Record<string,[number,number]>={A:[-3,1],B:[-1.2,2],C:[-1.2,-1],D:[1.1,1],E:[1.1,-1.5],F:[3,0]};for(const[a,b]of graphEdges){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...pos[a],0),new THREE.Vector3(...pos[b],0)]);group.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0x395248})));}graphNodes.forEach(n=>{const visited=current.visited?.includes(n);const mesh=new THREE.Mesh(new THREE.SphereGeometry(.45,32,18),new THREE.MeshStandardMaterial({color:current.current===n?amber:visited?green:muted}));mesh.position.set(...pos[n],0);group.add(mesh);const s=labelSprite(current.distances&&Number.isFinite(current.distances[n])?n+" · "+current.distances[n]:n,"#f4f8f5");s.position.set(pos[n][0],pos[n][1],.65);group.add(s);});}
    else{const vals=current.values.length?current.values:[5,3,7,2,4,6,8];vals.forEach((v,i)=>{const level=Math.floor(Math.log2(i+1)),first=Math.pow(2,level)-1,count=Math.pow(2,level),slot=i-first,x=(slot-(count-1)/2)*(5.8/count),y=2-level*1.55;if(i>0){const p=Math.floor((i-1)/2),pl=Math.floor(Math.log2(p+1)),pf=Math.pow(2,pl)-1,pc=Math.pow(2,pl),ps=p-pf,px=(ps-(pc-1)/2)*(5.8/pc),py=2-pl*1.55;const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(px,py,0),new THREE.Vector3(x,y,0)]);group.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0x395248})));}const mesh=new THREE.Mesh(new THREE.SphereGeometry(.4,28,16),new THREE.MeshStandardMaterial({color:active.has(i)?amber:settled.has(i)?green:muted}));mesh.position.set(x,y,0);group.add(mesh);const s=labelSprite(String(v),"#f4f8f5");s.position.set(x,y,.6);group.add(s);});}
    let raf=0;const draw=()=>{group.rotation.y=Math.sin(performance.now()/3000)*.08;renderer.render(scene,camera);raf=requestAnimationFrame(draw)};draw();const resize=()=>{if(!el.clientWidth||!el.clientHeight)return;camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};const observer=new ResizeObserver(resize);observer.observe(el);return()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});};},[algorithm,current]);return <div className="three-stage" ref={host} aria-label={"Three-dimensional simulation for "+algorithm.title}/>;
}

export default function AlgorithmLab(){
  const [selected,setSelected]=useState("binary-search"),[category,setCategory]=useState("All"),[language,setLanguage]=useState<Language>("typescript"),[input,setInput]=useState(""),[variant,setVariant]=useState(""),[step,setStep]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1);
  const algorithm=algorithms.find(a=>a.id===selected) ?? algorithms[0];
  useEffect(()=>{setInput(algorithm.defaultInput);setVariant(algorithm.variants?.[0]??"");setStep(0);setPlaying(false)},[algorithm]);
  const trace=useMemo(()=>buildTrace(algorithm,input,variant),[algorithm,input,variant]);const current=trace[Math.min(step,trace.length-1)];const source=getCode(algorithm.id,language);const activeLine=lineFor(step,source);
  useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{if(step>=trace.length-1)setPlaying(false);else setStep(s=>s+1)},900/speed);return()=>clearTimeout(timer)},[playing,step,trace.length,speed]);
  const choose=(id:string)=>{setSelected(id);setStep(0)};const filtered=algorithms.filter(a=>category==="All"||a.category===category);
  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">A.</span><div><strong>Algorithm Atlas</strong><small>Phase 01 · Interactive systems</small></div></div><div className="header-meta"><span><i/> Four languages</span><span>13 lessons</span><button onClick={()=>{setStep(0);setPlaying(true)}}>Start lesson</button></div></header>
    <section className="hero"><div><p className="eyebrow">UNDERSTAND THE MOTION, NOT JUST THE OUTPUT</p><h1>Watch code <em>become</em> an algorithm.</h1><p>Step through every comparison, mutation, queue, branch, and recursive call—then switch languages without losing your place.</p></div><div className="hero-stats"><div><b>13</b><span>algorithms</span></div><div><b>04</b><span>languages</span></div><div><b>∞</b><span>replays</span></div></div></section>
    <nav className="category-tabs" aria-label="Algorithm categories">{categories.map(c=><button className={category===c?"active":""} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</nav>
    <section className="workspace">
      <aside className="catalog"><div className="section-label"><span>CATALOG</span><b>{String(filtered.length).padStart(2,"0")}</b></div>{filtered.map((a,i)=><button className={"catalog-item "+(selected===a.id?"selected":"")} key={a.id} onClick={()=>choose(a.id)}><span>{String(i+1).padStart(2,"0")}</span><div><strong>{a.title}</strong><small>{a.category} · {a.difficulty}</small></div><i/></button>)}</aside>
      <div className="lab">
        <div className="lesson-head"><div><div className="crumb">{algorithm.category} / {algorithm.difficulty}</div><h2>{algorithm.title}</h2><p>{algorithm.summary}</p></div><div className="complexity"><div><span>TIME</span><b>{algorithm.time}</b></div><div><span>SPACE</span><b>{algorithm.space}</b></div></div></div>
        <div className="simulation-card"><div className="card-top"><span>LIVE SIMULATION</span><div><i className="live-dot"/> STEP {String(step+1).padStart(2,"0")} / {String(trace.length).padStart(2,"0")}</div></div><ThreeScene algorithm={algorithm} current={current}/><div className="scene-legend"><span><i className="mint"/>Complete</span><span><i className="amber"/>Active</span><span><i className="slate"/>Pending</span></div></div>
        <div className="controls"><button aria-label="Restart" onClick={()=>{setStep(0);setPlaying(false)}}>↺</button><button aria-label="Previous step" disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}>←</button><button className="play" aria-label={playing?"Pause":"Play"} onClick={()=>setPlaying(p=>!p)}>{playing?"Ⅱ":"▶"}</button><button aria-label="Next step" disabled={step>=trace.length-1} onClick={()=>setStep(s=>Math.min(trace.length-1,s+1))}>→</button><input aria-label="Simulation progress" type="range" min="0" max={trace.length-1} value={step} onChange={e=>setStep(Number(e.target.value))}/><select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value=".5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></div>
        <div className="step-panel"><span className="step-number">{String(step+1).padStart(2,"0")}</span><div><small>CURRENT STEP · {current.action.toUpperCase()}</small><p>{current.message}</p></div><div className="invariant"><small>INVARIANT</small><p>{algorithm.insight}</p></div></div>
      </div>
      <aside className="code-panel"><div className="language-tabs">{languages.map(l=><button key={l.id} className={language===l.id?"active":""} onClick={()=>setLanguage(l.id as Language)}>{l.label}</button>)}</div><div className="code-title"><span>{algorithm.id.replaceAll("-","_")}.{language==="python"?"py":language==="java"?"java":language==="go"?"go":"ts"}</span><b>LINE {activeLine}</b></div><pre className="code-block">{source.split("\n").map((line,i)=><code className={i+1===activeLine?"active":""} key={i}><span>{String(i+1).padStart(2,"0")}</span>{line||" "}</code>)}</pre>
        <div className="input-panel"><div className="section-label"><span>INPUT</span><b>EDITABLE</b></div><label>Dataset / target<input value={input} onChange={e=>{setInput(e.target.value);setStep(0)}}/></label><div className="preset-row">{algorithm.presets.map(p=><button key={p.label} onClick={()=>{setInput(p.value);setStep(0)}}>{p.label}</button>)}</div>{algorithm.variants&&<div className="variant-row">{algorithm.variants.map(v=><button className={variant===v?"active":""} key={v} onClick={()=>{setVariant(v);setStep(0)}}>{v}</button>)}</div>}</div>
        <div className="state-panel"><div className="section-label"><span>STATE</span><b>SYNCED</b></div>{current.queue&&<p><span>QUEUE</span>{current.queue.join("  ·  ")||"empty"}</p>}{current.stack&&<p><span>STACK</span>{current.stack.join("  ·  ")||"empty"}</p>}{current.visited&&<p><span>VISITED</span>{current.visited.join("  ·  ")||"none"}</p>}<p><span>ACTION</span>{current.message}</p></div>
      </aside>
    </section>
    <footer><span>ALGORITHM ATLAS · PHASE 01</span><span>Built for deliberate practice</span><span>Three.js simulation engine</span></footer>
  </main>;
}
