"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { algorithms, categories, languages, type Language } from "./algorithmData";
import { getCodeSample } from "./codeSamples";
import { buildSimulation } from "./simulation";
import { CubeStage } from "./CubeStage";
import { SyntaxCode } from "./SyntaxCode";
import { defaultThemeId, isThemeId, themeById, themes, type ThemeId } from "./themes";

const initial = algorithms[0];
const THEME_STORAGE_KEY = "atlas-theme";
const THEME_EVENT = "atlas-theme-change";

function themeSwatch(id: ThemeId) {
  const [ground, accent] = themeById[id].dot;
  return { background: `linear-gradient(135deg, ${ground} 50%, ${accent} 50%)` };
}

// The saved theme is an external store: the server always renders the default,
// then React swaps in the stored choice after hydration. `storage` keeps
// multiple tabs in agreement for free.
function subscribeTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function readTheme(): ThemeId {
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved && isThemeId(saved) ? saved : defaultThemeId;
}
function readDefaultTheme(): ThemeId {
  return defaultThemeId;
}
function storeTheme(next: ThemeId) {
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function AlgorithmLab() {
  const [selected, setSelected] = useState(initial.id);
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState<Language>("typescript");
  const [input, setInput] = useState(initial.defaultInput);
  const [variant, setVariant] = useState(initial.variants?.[0] ?? "");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const theme = useSyncExternalStore(subscribeTheme, readTheme, readDefaultTheme);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const algorithm = algorithms.find(item => item.id === selected) ?? initial;
  const trace = useMemo(() => buildSimulation(algorithm, input, variant), [algorithm, input, variant]);
  const safeStep = Math.min(step, trace.length - 1), current = trace[safeStep];
  const sample = useMemo(() => getCodeSample(algorithm.id, language), [algorithm.id, language]);
  const activeLines = sample.highlights[current.codeKey] ?? sample.highlights.setup ?? [1];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (safeStep >= trace.length - 1) setPlaying(false);
      else setStep(value => value + 1);
    }, 820 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, safeStep, speed, trace.length]);

  const choose = (id: string) => {
    const next = algorithms.find(item => item.id === id) ?? initial;
    setSelected(next.id); setInput(next.defaultInput);
    setVariant(next.variants?.[0] ?? ""); setStep(0); setPlaying(false);
  };
  const visible = algorithms.filter(item => category === "All" || item.category === category);
  const progress = trace.length > 1 ? (safeStep / (trace.length - 1)) * 100 : 100;

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">AA</span><div><strong>Algorithm Atlas</strong><small>Interactive algorithm laboratory</small></div></div>
      <div className="header-meta">
        <span><i /> simulation online</span><span>13 algorithms · 4 languages</span>
        <div className="theme-picker" onKeyDown={event => { if (event.key === "Escape") setThemeMenuOpen(false); }}>
          <button aria-haspopup="menu" aria-expanded={themeMenuOpen} onClick={() => setThemeMenuOpen(value => !value)}>
            <i className="swatch" style={themeSwatch(theme)} />{themeById[theme].label}
          </button>
          {themeMenuOpen && <>
            <div className="theme-backdrop" onClick={() => setThemeMenuOpen(false)} />
            <div className="theme-menu" role="menu" aria-label="Theme">
              {themes.map(item => <button key={item.id} role="menuitem" className={item.id === theme ? "active" : ""}
                onClick={() => { storeTheme(item.id); setThemeMenuOpen(false); }}>
                <i className="swatch" style={themeSwatch(item.id)} />{item.label}
              </button>)}
            </div>
          </>}
        </div>
        <button onClick={() => { setStep(0); setPlaying(true); }}>Run lesson</button>
      </div>
    </header>
    <section className="intro">
      <div><p className="eyebrow">PHASE 01 · MOTION EXPLAINS THE CODE</p><h1>See the state change.<br /><em>Understand the algorithm.</em></h1></div>
      <p>Each line of code is synchronized with an animated cube simulation. Scrub, replay, and switch languages without losing the current idea.</p>
    </section>
    <nav className="category-tabs" aria-label="Algorithm categories">
      {categories.map(item => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}
    </nav>
    <section className="workspace">
      <aside className="catalog panel">
        <div className="panel-heading"><span>LIBRARY</span><b>{String(visible.length).padStart(2, "0")}</b></div>
        <div className="catalog-scroll">{visible.map((item, index) => <button className={`catalog-item ${selected === item.id ? "selected" : ""}`} key={item.id} onClick={() => choose(item.id)}>
          <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><small>{item.category} · {item.difficulty}</small></div><i />
        </button>)}</div>
        <div className="library-note"><span>TIP</span><p>Step with ← and → to read one operation at a time.</p></div>
      </aside>

      <section className="lab panel">
        <div className="lesson-head">
          <div><div className="crumb">{algorithm.category} / {algorithm.difficulty}</div><h2>{algorithm.title}</h2><p>{algorithm.summary}</p></div>
          <div className="complexity"><div><span>TIME</span><b>{algorithm.time}</b></div><div><span>SPACE</span><b>{algorithm.space}</b></div></div>
        </div>
        <div className="simulation-card">
          <div className="card-top"><span><i /> LIVE CUBE TRACE</span><b>{String(safeStep + 1).padStart(2, "0")} / {String(trace.length).padStart(2, "0")}</b></div>
          <CubeStage algorithm={algorithm} frame={current} />
          <div className="scene-caption"><small>{current.phase}</small><strong>{current.message}</strong><span>{current.detail}</span></div>
          <div className="scene-legend"><span><i className="active-cube" />Active</span><span><i className="settled-cube" />Resolved</span><span><i className="pending-cube" />Pending</span></div>
        </div>
        <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        <div className="controls">
          <button aria-label="Restart" onClick={() => { setStep(0); setPlaying(false); }}>↺</button>
          <button aria-label="Previous step" disabled={safeStep === 0} onClick={() => setStep(value => Math.max(0, value - 1))}>←</button>
          <button className="play" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(value => !value)}>{playing ? "Ⅱ" : "▶"}</button>
          <button aria-label="Next step" disabled={safeStep >= trace.length - 1} onClick={() => setStep(value => Math.min(trace.length - 1, value + 1))}>→</button>
          <input aria-label="Simulation progress" type="range" min="0" max={trace.length - 1} value={safeStep} onChange={event => setStep(Number(event.target.value))} />
          <select aria-label="Playback speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value=".5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select>
        </div>
      </section>
      <aside className="inspector panel">
        <div className="language-tabs">{languages.map(item => <button key={item.id} className={language === item.id ? "active" : ""} onClick={() => setLanguage(item.id as Language)}>{item.label}</button>)}</div>
        <div className="code-title"><span>{algorithm.id.replaceAll("-", "_")}.{language === "python" ? "py" : language === "typescript" ? "ts" : language}</span><b>LINES {activeLines.join(", ")}</b></div>
        <SyntaxCode sample={sample} language={language} active={activeLines} />
        <div className="step-inspector">
          <div className="step-badge">{String(safeStep + 1).padStart(2, "0")}</div>
          <div><small>CURRENT OPERATION</small><strong>{current.phase}</strong><p>{current.detail}</p></div>
        </div>
        <div className="input-panel">
          <div className="panel-heading"><span>INPUT</span><b>EDITABLE</b></div>
          <label>Dataset / target<input value={input} onChange={event => { setInput(event.target.value); setStep(0); setPlaying(false); }} /></label>
          <div className="preset-row">{algorithm.presets.map(preset => <button key={preset.label} onClick={() => { setInput(preset.value); setStep(0); }}>{preset.label}</button>)}</div>
          {algorithm.variants && <div className="variant-row">{algorithm.variants.map(item => <button className={variant === item ? "active" : ""} key={item} onClick={() => { setVariant(item); setStep(0); }}>{item}</button>)}</div>}
        </div>
        <div className="state-panel">
          <div className="panel-heading"><span>LIVE STATE</span><b>SYNCED</b></div>
          {current.pointers && <p><span>POINTERS</span>{Object.keys(current.pointers).join(" · ")}</p>}
          {current.frontier && <p><span>FRONTIER</span>{current.frontier.join(" · ") || "empty"}</p>}
          {current.visited && <p><span>VISITED</span>{current.visited.join(" · ") || "none"}</p>}
          {current.distances && <p><span>DISTANCES</span>{Object.entries(current.distances).map(([node, value]) => `${node} ${Number.isFinite(value) ? value : "∞"}`).join(" · ")}</p>}
          {current.path && current.path.length > 1 && <p><span>SHORTEST PATH</span>{current.path.join(" → ")}</p>}
          <p><span>INVARIANT</span>{algorithm.insight}</p>
        </div>
      </aside>
    </section>
    <footer><span>ALGORITHM ATLAS · PHASE 01</span><span>2D cube simulation engine</span><span>{themeById[theme].label} visual system</span></footer>
  </main>;
}
