/**
 * Floor pivot points: classic, Fibonacci, Camarilla, Woodie variants.
 * Inputs are previous period's H/L/C; outputs are the central pivot
 * plus three support and three resistance lines.
 */

export interface PivotInput {
  readonly high: number;
  readonly low: number;
  readonly close: number;
  /** Required only by Woodie pivots. */
  readonly open?: number;
}

export interface PivotLevels {
  readonly p: number;
  readonly r1: number;
  readonly r2: number;
  readonly r3: number;
  readonly s1: number;
  readonly s2: number;
  readonly s3: number;
}

export type PivotKind = "classic" | "fibonacci" | "camarilla" | "woodie";

export function computePivots(input: PivotInput, kind: PivotKind = "classic"): PivotLevels {
  const { high: h, low: l, close: c } = input;
  const range = h - l;
  switch (kind) {
    case "classic": {
      const p = (h + l + c) / 3;
      return {
        p,
        r1: 2 * p - l,
        s1: 2 * p - h,
        r2: p + range,
        s2: p - range,
        r3: h + 2 * (p - l),
        s3: l - 2 * (h - p),
      };
    }
    case "fibonacci": {
      const p = (h + l + c) / 3;
      return {
        p,
        r1: p + 0.382 * range,
        s1: p - 0.382 * range,
        r2: p + 0.618 * range,
        s2: p - 0.618 * range,
        r3: p + 1.0 * range,
        s3: p - 1.0 * range,
      };
    }
    case "camarilla": {
      const p = (h + l + c) / 3;
      return {
        p,
        r1: c + (range * 1.1) / 12,
        s1: c - (range * 1.1) / 12,
        r2: c + (range * 1.1) / 6,
        s2: c - (range * 1.1) / 6,
        r3: c + (range * 1.1) / 4,
        s3: c - (range * 1.1) / 4,
      };
    }
    case "woodie": {
      if (input.open === undefined) {
        throw new TypeError("Woodie pivots require previous open");
      }
      const p = (h + l + 2 * c) / 4;
      return {
        p,
        r1: 2 * p - l,
        s1: 2 * p - h,
        r2: p + range,
        s2: p - range,
        r3: h + 2 * (p - l),
        s3: l - 2 * (h - p),
      };
    }
  }
}
