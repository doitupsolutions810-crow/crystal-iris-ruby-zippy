import { useEffect, useMemo, useState } from "react";
import {
  ACTION,
  COMPLEMENT_PAIRS,
  PHI,
  PHI_INV,
  PHI_INV2,
  RESIDUAL,
  fmt,
  heatProfile,
  type ScaleSample,
} from "@/lib/scale-math";
import { ScaleStage, type Layers, type ViewId } from "@/components/scale-stage";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "watch", label: "Watch" },
  { id: "observer", label: "Observer" },
  { id: "forward", label: "Forward" },
  { id: "adjacent", label: "Adjacent" },
  { id: "down", label: "Down" },
];

const LAYER_KEYS: { key: keyof Layers; label: string }[] = [
  { key: "orbit", label: "Orbit" },
  { key: "heat", label: "Heat" },
  { key: "nine", label: "Ninefold" },
  { key: "cylinder", label: "Cylinder" },
  { key: "residual", label: "Residual" },
];

const INITIAL: ScaleSample = {
  t: 0,
  H: 1 / (1 + Math.exp(0.85 * 3.4)),
  S: 0,
  stress: 0,
  residue: 8.2,
  inward: 0.8,
  level: 0,
  lambda: 1,
  cone: 1,
  heatGap: 0,
  psi: RESIDUAL,
  residual: RESIDUAL,
};

export function ScaleLab() {
  const [running, setRunning] = useState(true);
  const [rate, setRate] = useState(0.85);
  const [probeText, setProbeText] = useState("17.2");
  const [view, setView] = useState<ViewId>("watch");
  const [resetToken, setResetToken] = useState(0);
  const [layers, setLayers] = useState<Layers>({
    orbit: true,
    heat: true,
    nine: true,
    cylinder: true,
    residual: true,
  });
  const [sample, setSample] = useState<ScaleSample>(INITIAL);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setRunning(false);
  }, []);

  const probe = Number(probeText);
  const probeSafe = Number.isFinite(probe) ? probe : 17.2;

  const plot = useMemo(() => {
    const d: string[] = [];
    for (let i = 0; i <= 40; i += 1) {
      const h = i / 40;
      const x = 8 + h * 248;
      const y = 78 - heatProfile(h) * 240;
      d.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return d.join(" ");
  }, []);

  const hx = 8 + sample.H * 248;
  const hy = 78 - sample.S * 240;
  const activePair = COMPLEMENT_PAIRS.find((pair) => {
    const r = Math.round(sample.residue);
    return pair[0] === r || pair[1] === r || pair[0] === Math.round(sample.inward);
  });

  return (
    <div className="lab">
      <header className="topbar">
        <div className="brand">
          <h1>Great Scale</h1>
          <p>Test environment · three embeddings of one state</p>
        </div>
        <div className="view-row" role="group" aria-label="Viewpoint">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="chip"
              data-on={view === v.id}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <div className="stage-wrap">
        <ScaleStage
          running={running}
          rate={rate}
          probe={probeSafe}
          view={view}
          layers={layers}
          resetToken={resetToken}
          onSample={setSample}
        />

        <aside className="dock" aria-label="Live equations">
          <h2>The equation, substituted</h2>
          <p className="finding">
            Closure holds on the heat and the ninefold. It fails on the orbit by √5 − 2, and that
            failure is the cone the marker is walking into.
          </p>
          <div className="eq">
            <p>
              <span className="k">S(h) = h(1 − h)</span>
            </p>
            <p>
              <span className="k">S(</span>
              <span className="v">{fmt(sample.H, 3)}</span>
              <span className="k">) = </span>
              <span className="v">{fmt(sample.H, 3)}</span>
              <span className="k"> × </span>
              <span className="v">{fmt(1 - sample.H, 3)}</span>
              <span className="k"> = </span>
              <span className="v">{fmt(sample.S, 4)}</span>
            </p>
            <p>
              <span className="k">Ḣ = r S(H) = </span>
              <span className="v">{fmt(rate, 2)}</span>
              <span className="k"> × </span>
              <span className="v">{fmt(sample.S, 4)}</span>
              <span className="k"> = </span>
              <span className="v">{fmt(sample.stress, 4)}</span>
            </p>
            <p>
              <span className="k">J[S] = </span>
              <span className="v">{fmt(ACTION, 4)}</span>
              <span className="k"> = −1/6</span>
            </p>
            <p>
              <span className="k">ρ(</span>
              <span className="v">{fmt(probeSafe, 1)}</span>
              <span className="k">) = </span>
              <span className="v">{fmt(sample.residue, 1)}</span>
              <span className="k"> · inward f = 9 − ρ = </span>
              <span className="v">{fmt(sample.inward, 1)}</span>
            </p>
            <p>
              <span className="k">level n = </span>
              <span className="v">{fmt(sample.level, 2)}</span>
              <span className="k"> · λ = φ^(−n) = </span>
              <span className="v">{fmt(sample.lambda, 4)}</span>
            </p>
            <p>
              <span className="k">cone step φ^(−2) at even pairs = </span>
              <span className="v">{fmt(sample.cone, 4)}</span>
            </p>
            <p>
              <span className="k">φ⁻¹ − φ⁻² = √5 − 2 = </span>
              <span className="v">{fmt(RESIDUAL, 4)}</span>
            </p>
            <p>
              <span className="k">Ψ = heat gap + residual = </span>
              <span className="v">{fmt(sample.psi, 4)}</span>
            </p>
            <p>
              <span className="k">φ = </span>
              <span className="v">{fmt(PHI, 6)}</span>
              <span className="k"> · φ⁻¹ = </span>
              <span className="v">{fmt(PHI_INV, 4)}</span>
              <span className="k"> · φ⁻² = </span>
              <span className="v">{fmt(PHI_INV2, 4)}</span>
            </p>
          </div>

          <svg className="plot" viewBox="0 0 264 88" role="img" aria-label="Heat profile with the moving state">
            <rect x="0" y="0" width="264" height="88" fill="#12110e" rx="8" />
            <path d={plot} fill="none" stroke="#d4a054" strokeWidth="1.6" />
            <line x1={hx} y1="82" x2={hx} y2={hy} stroke="#8f8778" strokeWidth="1" />
            <circle cx={hx} cy={hy} r="3.5" fill="#efe8d8" />
          </svg>

          <div className="pairs" aria-label="Complement pairs">
            {COMPLEMENT_PAIRS.map(([a, b]) => (
              <span key={`${a}-${b}`} data-on={activePair?.[0] === a}>
                {a}–{b}
              </span>
            ))}
          </div>
          <p className="note">
            17.2 residues to 8.2. The scale uses the inward fold, 0.8, not 8.2. At 4.5 the complement
            is a fixed point; the page’s f(4.5) = 9.5 is the pair 4+5 with the center still written on
            it. Now is the slope Ḣ, largest at one half, which is where the cone opens. Ψ falls toward
            √5 − 2 and does not reach zero.
          </p>
        </aside>

        <div className="controls">
          <div className="transport">
            <button type="button" data-on={running} onClick={() => setRunning((v) => !v)}>
              {running ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={() => setResetToken((n) => n + 1)}>
              Replay
            </button>
          </div>
          <label className="slider">
            rate r
            <input
              type="range"
              min={0.2}
              max={2}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <output>{rate.toFixed(2)}</output>
          </label>
          <label className="probe">
            probe
            <input
              inputMode="decimal"
              value={probeText}
              onChange={(e) => setProbeText(e.target.value)}
              aria-label="Probe on the ninefold"
            />
          </label>
          <div className="layer-row">
            {LAYER_KEYS.map((layer) => (
              <button
                key={layer.key}
                type="button"
                className="chip"
                data-on={layers[layer.key]}
                onClick={() => setLayers((prev) => ({ ...prev, [layer.key]: !prev[layer.key] }))}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
