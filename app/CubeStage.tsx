"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { AlgorithmDefinition } from "./algorithmData";
import { graphEdges, type SimFrame } from "./simulation";

// All layout happens in a fixed 660×360 logical space; .sim-inner is scaled
// to fit the visible stage, so positions and motion stay resolution-independent.
const STAGE_W = 660, STAGE_H = 360, HALF = 26, LIFT = 24;

const graphPositions: Record<string, { x: number; y: number }> = {
  A: { x: 68, y: 97 }, B: { x: 228, y: 38 }, C: { x: 228, y: 249 },
  D: { x: 420, y: 94 }, E: { x: 420, y: 269 }, F: { x: 592, y: 170 },
};

// Horizontal spread of a lane-based (divide-and-conquer) layout, measured once
// per frame so split runs keep a consistent scale as they fan out.
type Spread = { count: number; min: number; max: number; laned: boolean; lanes: number; size: number; span: number };

function measure(frame: SimFrame): Spread {
  let min = Infinity, max = -Infinity, laned = false;
  for (const item of frame.items) {
    if (item.col === undefined) continue;
    laned = true;
    min = Math.min(min, item.col);
    max = Math.max(max, item.col);
  }
  const lanes = Math.max(1, frame.lanes ?? 1);
  // Cubes shrink to fit a dense tree rather than overlapping each other. The
  // span comes from the trace-wide `cols` so scale never changes mid-trace.
  const span = Math.max(1, frame.cols ?? (max - min));
  const size = laned
    ? Math.round(Math.max(28, Math.min(HALF * 2, pitchFor(span) - 6, laneHeightFor(lanes) - 8)))
    : HALF * 2;
  return { count: frame.items.length, min, max, laned, lanes, size, span };
}

const pitchFor = (span: number) => Math.min(66, 592 / Math.max(1, span));
// Deep trees are kept clear of the caption strip along the bottom of the stage.
const laneHeightFor = (lanes: number) => Math.min(58, 190 / Math.max(1, lanes - 1));
const laneTopFor = (lanes: number) => 150 - (lanes - 1) * laneHeightFor(lanes) / 2;

function layoutPosition(algorithm: AlgorithmDefinition, item: SimFrame["items"][number], index: number, spread: Spread) {
  if (item.lane !== undefined && item.col !== undefined) {
    // Lane 0 is the top row. Merge sort pushes split halves one lane deeper and
    // lifts merged runs back up; recursion puts each call at its own depth. The
    // block is sized from the trace-wide lane count so rows never drift.
    const pitch = pitchFor(spread.span);
    const middle = (spread.min + spread.max) / 2;
    return { x: STAGE_W / 2 + (item.col - middle) * pitch, y: laneTopFor(spread.lanes) + item.lane * laneHeightFor(spread.lanes) };
  }
  if (algorithm.structure === "graph") return graphPositions[item.id] ?? { x: STAGE_W / 2, y: STAGE_H / 2 };
  if (algorithm.structure === "tree") {
    const slot = item.slot ?? index, level = Math.floor(Math.log2(slot + 1));
    const place = slot - (2 ** level - 1), width = 560 / 2 ** level;
    return { x: STAGE_W / 2 + (place - (2 ** level - 1) / 2) * width, y: 70 + level * 84 };
  }
  return { x: STAGE_W / 2 + (index - (spread.count - 1) / 2) * 66, y: 190 };
}

const easeInOutCubic = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type CubeRecord = { x: number; y: number; sx: number; sy: number; raf: number };

export function CubeStage({ algorithm, frame }: { algorithm: AlgorithmDefinition; frame: SimFrame }) {
  const host = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const records = useRef(new Map<string, CubeRecord>());
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const current = records.current;
    return () => { for (const record of current.values()) cancelAnimationFrame(record.raf); };
  }, []);

  useEffect(() => {
    const stage = host.current, world = inner.current;
    if (!stage || !world) return;
    const fit = () => {
      const scale = Math.min(stage.clientWidth / STAGE_W, stage.clientHeight / STAGE_H);
      world.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const half = measure(frame).size / 2;
    const apply = (el: HTMLDivElement, record: CubeRecord) => {
      el.style.transform = `translate(${record.x - half}px, ${record.y - half}px) scale(${record.sx}, ${record.sy})`;
    };
    for (const [id, record] of records.current) {
      if (!els.current.has(id)) { cancelAnimationFrame(record.raf); records.current.delete(id); }
    }
    const spread = measure(frame);
    inner.current?.style.setProperty("--cube-size", `${spread.size}px`);
    const lift = Math.min(LIFT, spread.size * .46);
    const targets = new Map(frame.items.map((item, index) => {
      const position = layoutPosition(algorithm, item, index, spread);
      return [item.id, { x: position.x, y: position.y - (frame.active.includes(item.id) ? lift : 0) }] as const;
    }));

    // Cubes exchanging positions travel on opposing arcs: the right-mover goes
    // over, the left-mover dips under, so a swap never reads as a pass-through.
    const moving = frame.items.map(item => item.id).filter(id => {
      const record = records.current.get(id), target = targets.get(id);
      return !!record && !!target && Math.hypot(target.x - record.x, target.y - record.y) > .5;
    });
    const arcOf = new Map<string, number>();
    for (const idA of moving) {
      for (const idB of moving) {
        if (idA >= idB || arcOf.has(idA) || arcOf.has(idB)) continue;
        const a = records.current.get(idA)!, b = records.current.get(idB)!;
        const targetA = targets.get(idA)!, targetB = targets.get(idB)!;
        if (Math.hypot(targetA.x - b.x, targetA.y - b.y) < 2 && Math.hypot(targetB.x - a.x, targetB.y - a.y) < 2) {
          const span = Math.abs(targetA.x - a.x);
          const over = -Math.min(46, 16 + span * .18), under = Math.min(24, 8 + span * .1);
          const aGoesRight = targetA.x >= a.x;
          arcOf.set(idA, aGoesRight ? over : under);
          arcOf.set(idB, aGoesRight ? under : over);
        }
      }
    }
    for (const id of moving) {
      if (arcOf.has(id)) continue;
      const record = records.current.get(id)!, target = targets.get(id)!;
      const span = Math.abs(target.x - record.x);
      if (span > 100) arcOf.set(id, -Math.min(46, 12 + span * .12));
    }

    frame.items.forEach(item => {
      const el = els.current.get(item.id);
      const target = targets.get(item.id);
      if (!el || !target) return;
      let record = records.current.get(item.id);
      if (!record) {
        record = { x: target.x, y: target.y, sx: .4, sy: .4, raf: 0 };
        records.current.set(item.id, record);
        if (reduced.current) { record.sx = record.sy = 1; apply(el, record); return; }
        el.style.opacity = "0";
        apply(el, record);
        const start = performance.now();
        const grow = (now: number) => {
          const k = Math.min(1, (now - start) / 240), p = easeOutCubic(k);
          record!.sx = record!.sy = .4 + .6 * p;
          el.style.opacity = k >= 1 ? "" : String(p);
          apply(el, record!);
          if (k < 1) record!.raf = requestAnimationFrame(grow);
        };
        record.raf = requestAnimationFrame(grow);
        return;
      }
      const fromX = record.x, fromY = record.y;
      const dx = target.x - fromX, dy = target.y - fromY;
      const distance = Math.hypot(dx, dy);
      cancelAnimationFrame(record.raf);
      if (distance < .5 || reduced.current) {
        record.x = target.x; record.y = target.y; record.sx = record.sy = 1;
        apply(el, record);
        return;
      }
      const arc = arcOf.get(item.id) ?? 0;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const strength = Math.min(1, distance / 66);
      const start = performance.now();
      const travel = (now: number) => {
        const k = Math.min(1, (now - start) / 380);
        const p = easeInOutCubic(k), s = Math.sin(Math.PI * k);
        record!.x = fromX + dx * p;
        record!.y = fromY + dy * p + arc * s;
        record!.sx = horizontal ? 1 + .2 * s * strength : 1 - .13 * s * strength;
        record!.sy = horizontal ? 1 - .13 * s * strength : 1 + .2 * s * strength;
        apply(el, record!);
        if (k < 1) { record!.raf = requestAnimationFrame(travel); return; }
        record!.x = target.x; record!.y = target.y;
        if (distance <= 30) { record!.sx = record!.sy = 1; apply(el, record!); return; }
        const landed = performance.now();
        const land = (now2: number) => {
          const k2 = Math.min(1, (now2 - landed) / 150), s2 = Math.sin(Math.PI * k2) * strength;
          record!.sx = horizontal ? 1 + .1 * s2 : 1 - .11 * s2;
          record!.sy = horizontal ? 1 - .11 * s2 : 1 + .1 * s2;
          apply(el, record!);
          if (k2 < 1) record!.raf = requestAnimationFrame(land);
          else { record!.sx = record!.sy = 1; apply(el, record!); }
        };
        record!.raf = requestAnimationFrame(land);
      };
      record.raf = requestAnimationFrame(travel);
    });
    inner.current?.setAttribute("data-ready", "");
  }, [algorithm, frame]);

  const spread = measure(frame);
  const links: React.ReactNode[] = [];
  if (algorithm.structure === "graph") {
    const onPath = new Set<string>();
    for (let index = 1; index < (frame.path?.length ?? 0); index++) {
      onPath.add([frame.path![index - 1], frame.path![index]].sort().join("-"));
    }
    for (const [from, to] of graphEdges) {
      const a = graphPositions[from], b = graphPositions[to];
      const key = [from, to].sort().join("-");
      const className = onPath.has(key) ? "path"
        : frame.active.includes(from) && frame.active.includes(to) ? "active" : "";
      links.push(<line key={`${from}-${to}`} className={className} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
    }
  }
  if (algorithm.structure === "tree") {
    frame.items.forEach((item, index) => {
      const slot = item.slot ?? index;
      if (slot === 0) return;
      const parentSlot = Math.floor((slot - 1) / 2);
      const parentIndex = frame.items.findIndex(candidate => (candidate.slot ?? 0) === parentSlot);
      if (parentIndex < 0) return;
      const a = layoutPosition(algorithm, frame.items[parentIndex], parentIndex, spread);
      const b = layoutPosition(algorithm, item, index, spread);
      links.push(<line key={item.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
    });
  }
  // Explicit parent links (recursion call trees). A branch lights up once the
  // child has been called, and turns settled once it has returned.
  frame.items.forEach((item, index) => {
    if (!item.parent) return;
    const parentIndex = frame.items.findIndex(candidate => candidate.id === item.parent);
    if (parentIndex < 0) return;
    const a = layoutPosition(algorithm, frame.items[parentIndex], parentIndex, spread);
    const b = layoutPosition(algorithm, item, index, spread);
    const className = frame.settled.includes(item.id) ? "path"
      : frame.dimmed.includes(item.id) ? "faint" : "active";
    links.push(<line key={`link-${item.id}`} className={className} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
  });

  return <div className="sim-stage" ref={host} aria-label={`${algorithm.title} simulation`}>
    <div className="sim-inner" ref={inner}>
      {algorithm.structure === "array" && !spread.laned && <i className="sim-floor" />}
      <svg className="sim-links" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} aria-hidden="true">{links}</svg>
      {frame.items.map(item => <div
        key={item.id}
        ref={el => { if (el) els.current.set(item.id, el); else els.current.delete(item.id); }}
        className={[
          "sim-cube",
          frame.active.includes(item.id) ? "act" : "",
          frame.settled.includes(item.id) ? "set" : "",
          frame.dimmed.includes(item.id) ? "dim" : "",
          item.label.length > 2 ? "long" : "",
          frame.path?.includes(item.id) ? "onpath" : "",
          item.repeat ? "repeat" : "",
        ].filter(Boolean).join(" ")}>
        <span>{item.label}</span>
        {item.badge !== undefined && <i className="sim-badge">{item.badge}</i>}
      </div>)}
    </div>
  </div>;
}
