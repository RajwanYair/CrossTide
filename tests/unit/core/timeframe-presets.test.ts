/**
 * Sprint 3: Chart timeframe presets tests.
 */
import { describe, it, expect } from "vitest";
import {
  TIMEFRAME_PRESETS,
  DEFAULT_TIMEFRAME,
  type TimeframePreset,
} from "../../../src/core/data-service";

describe("Chart timeframe presets", () => {
  it("exports 6 preset timeframes", () => {
    expect(TIMEFRAME_PRESETS).toHaveLength(6);
  });

  it("each preset has label, range, and interval", () => {
    for (const preset of TIMEFRAME_PRESETS) {
      expect(preset.label).toBeTruthy();
      expect(preset.range).toBeTruthy();
      expect(preset.interval).toBeTruthy();
    }
  });

  it("default timeframe is 1Y daily", () => {
    expect(DEFAULT_TIMEFRAME.label).toBe("1Y");
    expect(DEFAULT_TIMEFRAME.range).toBe("1y");
    expect(DEFAULT_TIMEFRAME.interval).toBe("1d");
  });

  it("preset labels are ordered short to long", () => {
    const labels = TIMEFRAME_PRESETS.map((p: TimeframePreset) => p.label);
    expect(labels).toEqual(["1D", "5D", "1M", "3M", "1Y", "5Y"]);
  });

  it("intraday presets use sub-daily intervals", () => {
    const oneDay = TIMEFRAME_PRESETS.find((p) => p.label === "1D")!;
    expect(oneDay.interval).toBe("5m");

    const fiveDay = TIMEFRAME_PRESETS.find((p) => p.label === "5D")!;
    expect(fiveDay.interval).toBe("15m");
  });
});
