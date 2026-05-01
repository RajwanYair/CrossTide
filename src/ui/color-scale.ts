/**
 * Linear color scale: maps a numeric domain [min, max] to a color
 * along a list of stops. Returns CSS rgb()/rgba() strings. Built for
 * sector heatmaps (red → white → green) and similar.
 */

export interface ColorStop {
  readonly position: number; // 0..1
  readonly rgb: readonly [number, number, number];
}

export interface ColorScaleOptions {
  readonly stops: readonly ColorStop[];
  readonly clamp?: boolean;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const toCss = (rgb: readonly [number, number, number]): string =>
  `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`;

/** Linear interpolation between sorted stops. */
export function interpolateColor(t: number, stops: readonly ColorStop[]): [number, number, number] {
  if (stops.length === 0) return [0, 0, 0];
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  if (t <= sorted[0]!.position) return [...sorted[0]!.rgb] as [number, number, number];
  if (t >= sorted[sorted.length - 1]!.position) {
    return [...sorted[sorted.length - 1]!.rgb] as [number, number, number];
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    if (t >= a.position && t <= b.position) {
      const span = b.position - a.position;
      const local = span === 0 ? 0 : (t - a.position) / span;
      return [
        lerp(a.rgb[0], b.rgb[0], local),
        lerp(a.rgb[1], b.rgb[1], local),
        lerp(a.rgb[2], b.rgb[2], local),
      ];
    }
  }
  return [...sorted[sorted.length - 1]!.rgb] as [number, number, number];
}

export interface ColorScale {
  readonly css: (value: number) => string;
  readonly rgb: (value: number) => [number, number, number];
}

export function createColorScale(
  domainMin: number,
  domainMax: number,
  options: ColorScaleOptions,
): ColorScale {
  const span = domainMax - domainMin;
  const clamp = options.clamp ?? true;
  const normalize = (v: number): number => {
    if (span === 0) return 0.5;
    let t = (v - domainMin) / span;
    if (clamp) t = Math.max(0, Math.min(1, t));
    return t;
  };
  return {
    rgb: (v: number): [number, number, number] => interpolateColor(normalize(v), options.stops),
    css: (v: number): string => toCss(interpolateColor(normalize(v), options.stops)),
  };
}

/** Symmetric red → white → green divergent scale around 0. */
export function createDivergentScale(absMax: number): ColorScale {
  return createColorScale(-absMax, absMax, {
    stops: [
      { position: 0, rgb: [200, 40, 40] },
      { position: 0.5, rgb: [240, 240, 240] },
      { position: 1, rgb: [40, 160, 70] },
    ],
  });
}
