/**
 * Multi-series sparkline path builder. Pure SVG-path generator —
 * no DOM dependency, easy to test, easy to embed in any renderer.
 */

export interface SparklineSeries {
  readonly id: string;
  readonly values: readonly number[];
  /** Optional CSS color override for this series. */
  readonly color?: string;
}

export interface SparklineLayout {
  readonly width: number;
  readonly height: number;
  /** Inner padding so strokes don't get clipped. Default 1. */
  readonly padding?: number;
  /** When true, every series shares the same y-scale. Default true. */
  readonly sharedScale?: boolean;
}

export interface SparklinePath {
  readonly id: string;
  readonly d: string;
  readonly color: string | undefined;
  readonly min: number;
  readonly max: number;
}

export function buildSparklinePaths(
  series: readonly SparklineSeries[],
  layout: SparklineLayout,
): SparklinePath[] {
  const pad = layout.padding ?? 1;
  const w = Math.max(0, layout.width - pad * 2);
  const h = Math.max(0, layout.height - pad * 2);
  const sharedScale = layout.sharedScale !== false;

  let globalMin = Infinity;
  let globalMax = -Infinity;
  if (sharedScale) {
    for (const s of series) {
      for (const v of s.values) {
        if (Number.isFinite(v)) {
          if (v < globalMin) globalMin = v;
          if (v > globalMax) globalMax = v;
        }
      }
    }
  }

  const out: SparklinePath[] = [];
  for (const s of series) {
    const finite = s.values.filter((v) => Number.isFinite(v));
    let lo = sharedScale ? globalMin : Infinity;
    let hi = sharedScale ? globalMax : -Infinity;
    if (!sharedScale) {
      for (const v of finite) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    const range = hi - lo;
    const n = s.values.length;
    if (n === 0 || !Number.isFinite(lo) || !Number.isFinite(hi)) {
      out.push({ id: s.id, d: "", color: s.color, min: lo, max: hi });
      continue;
    }
    const stepX = n > 1 ? w / (n - 1) : 0;
    let d = "";
    let started = false;
    for (let i = 0; i < n; i++) {
      const v = s.values[i];
      if (v === undefined || !Number.isFinite(v)) continue;
      const x = pad + i * stepX;
      const y = range === 0 ? pad + h / 2 : pad + h - ((v - lo) / range) * h;
      d += started ? `L${x.toFixed(2)} ${y.toFixed(2)} ` : `M${x.toFixed(2)} ${y.toFixed(2)} `;
      started = true;
    }
    out.push({ id: s.id, d: d.trimEnd(), color: s.color, min: lo, max: hi });
  }
  return out;
}
