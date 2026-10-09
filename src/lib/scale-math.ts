/** Great Scale arithmetic taken from the notebook and the descent through it. */

export const PHI = (1 + Math.sqrt(5)) / 2;
export const PHI_INV = (Math.sqrt(5) - 1) / 2;
export const PHI_INV2 = (3 - Math.sqrt(5)) / 2;
/** φ^{-1} − φ^{-2}. The orbit refuses the midpoint by exactly this much. */
export const RESIDUAL = Math.sqrt(5) - 2;
export const ACTION = -1 / 6;

export const COMPLEMENT_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 9],
  [1, 8],
  [2, 7],
  [3, 6],
  [4, 5],
];

/** Ordinary residue that keeps the fraction: 17.2 → 8.2. Digital root, 9 stays 9. */
export function digitResidue(x: number): number {
  if (!Number.isFinite(x)) return 0;
  const neg = x < 0;
  const ax = Math.abs(x);
  const frac = ax - Math.floor(ax);
  let n = Math.floor(ax);
  if (n === 0) return neg ? -frac : frac;
  while (n >= 10) {
    let s = 0;
    let m = n;
    while (m > 0) {
      s += m % 10;
      m = Math.floor(m / 10);
    }
    n = s;
  }
  const r = n + frac;
  return neg ? -r : r;
}

/**
 * Inward fold. 8.2 is the outward residue; its complement to 9 is 0.8.
 * Fixed points on one turn of the scaffold are 0 and 4.5.
 */
export function inwardFold(x: number): number {
  const r = digitResidue(Math.abs(x));
  return r > 4.5 ? 9 - r : r;
}

export function heatProfile(h: number): number {
  return h * (1 - h);
}

/** Verhulst. Inflection, and the maximum of stress, sits at H = 1/2. */
export function logistic(t: number, rate: number, mid = 3.4): number {
  const z = -rate * (t - mid);
  const clamped = Math.max(-40, Math.min(40, z));
  return 1 / (1 + Math.exp(clamped));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export const MAX_LEVEL = 8;

export type ScaleSample = {
  t: number;
  H: number;
  S: number;
  stress: number;
  residue: number;
  inward: number;
  /** Continuous pentagram level. Opens only as H passes 1/2. */
  level: number;
  lambda: number;
  cone: number;
  /** Distance of H to the nearer stop. Falls after Now, floors at 0. */
  heatGap: number;
  /** Lyapunov. Falls toward the orbit residual and does not reach 0. */
  psi: number;
  residual: number;
};

export function sampleScale(t: number, rate: number, probe: number): ScaleSample {
  const H = logistic(t, rate);
  const S = heatProfile(H);
  const stress = rate * S;
  const residue = digitResidue(probe);
  const inward = inwardFold(probe);
  const level = smoothstep(0.42, 0.78, H) * MAX_LEVEL;
  const lambda = PHI ** (-level);
  const cone = PHI ** (-2 * Math.floor(level / 2));
  const heatGap = Math.min(H, 1 - H);
  const psi = heatGap + RESIDUAL;
  return {
    t,
    H,
    S,
    stress,
    residue,
    inward,
    level,
    lambda,
    cone,
    heatGap,
    psi,
    residual: RESIDUAL,
  };
}

export function pentagramVertex(
  index: number,
  radius: number,
  y: number,
  spin: number,
): [number, number, number] {
  const a = spin - Math.PI / 2 + (index * 2 * Math.PI) / 5;
  return [Math.cos(a) * radius, y, Math.sin(a) * radius];
}

/** Point walking the pentagram stroke (every second vertex) at fraction u in [0, 1). */
export function walkStar(
  u: number,
  radius: number,
  y: number,
  spin: number,
): [number, number, number] {
  const seg = (((u % 1) + 1) % 1) * 5;
  const i = Math.floor(seg);
  const f = seg - i;
  const a = pentagramVertex(i, radius, y, spin);
  const b = pentagramVertex(i + 2, radius, y, spin);
  return [a[0] * (1 - f) + b[0] * f, y, a[2] * (1 - f) + b[2] * f];
}

export function levelRadius(level: number, base = 1.9): number {
  return base * PHI ** -level;
}

export function levelHeight(level: number): number {
  return 0.12 + level * 0.46;
}

export function fmt(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "−" : "";
  return sign + Math.abs(n).toFixed(digits);
}
