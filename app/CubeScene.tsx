"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { AlgorithmDefinition } from "./algorithmData";
import { cubeVisualSignature } from "./cubeCache";
import { graphEdges, type SimFrame } from "./simulation";
import type { ScenePalette } from "./themes";

type CubeBundle = {
  group: THREE.Group;
  body: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  label: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  visualSignature: string;
  target: THREE.Vector3;
  targetScale: THREE.Vector3;
  targetColor: THREE.Color;
};

type SceneState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  world: THREE.Group;
  links: THREE.Group;
  cubes: Map<string, CubeBundle>;
  frame: SimFrame;
  algorithm: AlgorithmDefinition;
  palette: ScenePalette;
};

const graphPositions: Record<string, [number, number, number]> = {
  A: [-3.2, 1.1, 0], B: [-1.25, 2, 0], C: [-1.25, -1.2, 0],
  D: [1.1, 1.15, 0], E: [1.1, -1.5, 0], F: [3.2, 0, 0],
};

function labelTexture(text: string, palette: ScenePalette) {
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.fillStyle = palette.labelBg; context.fillRect(0, 0, 256, 128);
  context.fillStyle = palette.labelText;
  context.font = text.length > 5 ? "600 34px monospace" : "700 52px monospace";
  context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(text, 128, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCube(item: SimFrame["items"][number], palette: ScenePalette) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
  const material = new THREE.MeshStandardMaterial({ color: palette.cubeBase, roughness: .28, metalness: .15, emissive: palette.emissive, emissiveIntensity: .6 });
  const body = new THREE.Mesh(geometry, material);
  body.castShadow = true; body.receiveShadow = true; group.add(body);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: palette.cubeEdge, transparent: true, opacity: .35 }));
  group.add(edges);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.72, .36), new THREE.MeshBasicMaterial({ map: labelTexture(item.label, palette), transparent: true }));
  label.position.set(0, 0, .506); group.add(label);
  return {
    group, body, label, visualSignature: cubeVisualSignature(item), target: new THREE.Vector3(),
    targetScale: new THREE.Vector3(1, 1, 1), targetColor: new THREE.Color(palette.cubeBase),
  };
}

function refreshCubeLabel(cube: CubeBundle, item: SimFrame["items"][number], palette: ScenePalette) {
  const nextSignature = cubeVisualSignature(item);
  if (cube.visualSignature === nextSignature) return;
  cube.label.material.map?.dispose();
  cube.label.material.map = labelTexture(item.label, palette);
  cube.label.material.needsUpdate = true;
  cube.visualSignature = nextSignature;
}

function disposeCube(cube: CubeBundle) {
  cube.group.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      object.material.map?.dispose();
      object.material.dispose();
    }
    if (object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
}

function cubePosition(algorithm: AlgorithmDefinition, item: SimFrame["items"][number], index: number, count: number) {
  if (algorithm.structure === "graph") return new THREE.Vector3(...(graphPositions[item.id] ?? [0, 0, 0]));
  if (algorithm.structure === "recursion") return new THREE.Vector3((index - (count - 1) / 2) * .35, -1.9 + index * .9, -index * .16);
  if (algorithm.structure === "tree") {
    const slot = item.slot ?? index, level = Math.floor(Math.log2(slot + 1));
    const first = 2 ** level - 1, place = slot - first, width = 6.6 / 2 ** level;
    return new THREE.Vector3((place - (2 ** level - 1) / 2) * width, 2.1 - level * 1.65, 0);
  }
  return new THREE.Vector3((index - (count - 1) / 2) * 1.16, 0, 0);
}

function rebuildLinks(current: SceneState, algorithm: AlgorithmDefinition, frame: SimFrame) {
  current.links.traverse(object => {
    if (object instanceof THREE.Line) { object.geometry.dispose(); object.material.dispose(); }
  });
  current.links.clear();
  const connect = (from: THREE.Vector3, to: THREE.Vector3, active = false) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    const material = new THREE.LineBasicMaterial({ color: active ? current.palette.linkActive : current.palette.link, transparent: true, opacity: active ? .95 : .58 });
    current.links.add(new THREE.Line(geometry, material));
  };
  if (algorithm.structure === "graph") {
    for (const [from, to] of graphEdges) {
      connect(new THREE.Vector3(...graphPositions[from]), new THREE.Vector3(...graphPositions[to]), frame.active.includes(from) && frame.active.includes(to));
    }
  }
  if (algorithm.structure === "tree") {
    frame.items.forEach((item, index) => {
      const slot = item.slot ?? index; if (slot === 0) return;
      const parentSlot = Math.floor((slot - 1) / 2);
      const parentIndex = frame.items.findIndex(candidate => (candidate.slot ?? 0) === parentSlot);
      if (parentIndex < 0) return;
      connect(cubePosition(algorithm, frame.items[parentIndex], parentIndex, frame.items.length), cubePosition(algorithm, item, index, frame.items.length));
    });
  }
}

export function CubeScene({ algorithm, frame, playing, palette }: { algorithm: AlgorithmDefinition; frame: SimFrame; playing: boolean; palette: ScenePalette }) {
  const host = useRef<HTMLDivElement>(null), state = useRef<SceneState | null>(null);
  const initialFrame = useRef(frame), initialAlgorithm = useRef(algorithm), playingRef = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { initialFrame.current = frame; initialAlgorithm.current = algorithm; }, [frame, algorithm]);
  useEffect(() => {
    if (!host.current) return;
    const element = host.current, scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.stage);
    scene.fog = new THREE.Fog(palette.stage, 10, 22);
    const camera = new THREE.PerspectiveCamera(40, element.clientWidth / Math.max(element.clientHeight, 1), .1, 100);
    camera.position.set(0, 4.6, 9.3); camera.lookAt(0, 0, 0);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { element.innerHTML = '<div class="webgl-fallback">WebGL is unavailable. The step trace remains usable.</div>'; return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(element.clientWidth, element.clientHeight);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
    element.replaceChildren(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * .63; controls.target.set(0, 0, 0);
    const world = new THREE.Group(), links = new THREE.Group(); scene.add(links, world);
    scene.add(new THREE.HemisphereLight(palette.hemi[0], palette.hemi[1], 2.1));
    const key = new THREE.SpotLight(palette.spot, 42, 30, .65, .55, 1.3); key.position.set(4, 8, 6); key.castShadow = true; scene.add(key);
    const rim = new THREE.PointLight(palette.rim, 28, 18); rim.position.set(-5, 3, -2); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshStandardMaterial({ color: palette.floor, roughness: .9, metalness: .05 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.55; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(18, 18, palette.grid[0], palette.grid[1]); grid.position.y = -2.5; scene.add(grid);
    state.current = { scene, camera, renderer, controls, world, links, cubes: new Map(), frame: initialFrame.current, algorithm: initialAlgorithm.current, palette };
    let request = 0;
    const render = () => {
      const current = state.current;
      if (!current) return;
      for (const cube of current.cubes.values()) {
        cube.group.position.lerp(cube.target, .115);
        cube.group.scale.lerp(cube.targetScale, .13);
        cube.body.material.color.lerp(cube.targetColor, .12);
        cube.body.material.emissive.lerp(cube.targetColor, .06);
        if (playingRef.current && current.frame.active.includes(cube.group.name)) cube.group.rotation.y += .012;
        else cube.group.rotation.y *= .9;
      }
      current.controls.update(); current.renderer.render(current.scene, current.camera);
      request = requestAnimationFrame(render);
    };
    render();
    const observer = new ResizeObserver(() => {
      if (!element.clientWidth || !element.clientHeight) return;
      camera.aspect = element.clientWidth / element.clientHeight; camera.updateProjectionMatrix();
      renderer.setSize(element.clientWidth, element.clientHeight);
    });
    observer.observe(element);
    return () => {
      cancelAnimationFrame(request); observer.disconnect(); controls.dispose(); renderer.dispose();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) { object.geometry.dispose(); object.material.dispose(); }
      });
      state.current = null;
    };
  }, [palette]);

  useEffect(() => {
    const current = state.current; if (!current) return;
    current.frame = frame; current.algorithm = algorithm; current.palette = palette;
    rebuildLinks(current, algorithm, frame);
    const live = new Set(frame.items.map(item => item.id));
    for (const [id, cube] of current.cubes) {
      if (!live.has(id)) {
        current.world.remove(cube.group); disposeCube(cube); current.cubes.delete(id);
      }
    }
    frame.items.forEach((item, index) => {
      let cube = current.cubes.get(item.id);
      if (!cube) {
        cube = createCube(item, palette); cube.group.name = item.id;
        cube.group.position.copy(cubePosition(algorithm, item, index, frame.items.length)).add(new THREE.Vector3(0, -2, 0));
        current.world.add(cube.group); current.cubes.set(item.id, cube);
      }
      refreshCubeLabel(cube, item, palette);
      cube.target.copy(cubePosition(algorithm, item, index, frame.items.length));
      const active = frame.active.includes(item.id);
      const settled = frame.settled.includes(item.id);
      const dimmed = frame.dimmed.includes(item.id);
      if (active) cube.target.y += .55;
      cube.targetScale.setScalar(active ? 1.15 : dimmed ? .78 : 1);
      cube.targetColor.set(active ? palette.active : settled ? palette.settled : dimmed ? palette.dimmed : palette.pending);
      cube.body.material.opacity = dimmed ? .38 : 1;
      cube.body.material.transparent = dimmed;
    });
  }, [algorithm, frame, palette]);

  return <div className="three-stage" ref={host} aria-label={`Three-dimensional ${algorithm.title} simulation`} />;
}
