/**
 * Standard easing functions over t ∈ [0, 1]. All return a number in
 * [0, 1] (modulo overshooting easings like back/elastic). Plus a
 * `cubicBezier(p1x, p1y, p2x, p2y)` factory matching the CSS cubic-bezier
 * timing function (control points P0=(0,0), P3=(1,1), P1/P2 supplied).
 */

export type EasingFn = (t: number) => number;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

export const linear: EasingFn = (t) => clamp01(t);

export const easeInQuad: EasingFn = (t) => {
  const u = clamp01(t);
  return u * u;
};
export const easeOutQuad: EasingFn = (t) => {
  const u = clamp01(t);
  return 1 - (1 - u) * (1 - u);
};
export const easeInOutQuad: EasingFn = (t) => {
  const u = clamp01(t);
  return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
};

export const easeInCubic: EasingFn = (t) => {
  const u = clamp01(t);
  return u * u * u;
};
export const easeOutCubic: EasingFn = (t) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, 3);
};
export const easeInOutCubic: EasingFn = (t) => {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};

/**
 * CSS-compatible cubic-bezier easing. Solves for t given input x using
 * Newton-Raphson with bisection fallback.
 */
export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number): EasingFn {
  const ax = 1 + 3 * p1x - 3 * p2x;
  const bx = 3 * p2x - 6 * p1x;
  const cx = 3 * p1x;
  const ay = 1 + 3 * p1y - 3 * p2y;
  const by = 3 * p2y - 6 * p1y;
  const cy = 3 * p1y;

  const sampleX = (t: number): number => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number): number => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number): number => (3 * ax * t + 2 * bx) * t + cx;

  return (xInput: number): number => {
    const x = clamp01(xInput);
    let t = x;
    for (let i = 0; i < 8; i++) {
      const cur = sampleX(t) - x;
      if (Math.abs(cur) < 1e-6) return sampleY(t);
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= cur / slope;
    }
    let lo = 0;
    let hi = 1;
    let mid = x;
    for (let i = 0; i < 32; i++) {
      mid = (lo + hi) / 2;
      const v = sampleX(mid);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = mid;
      else hi = mid;
    }
    return sampleY(mid);
  };
}
