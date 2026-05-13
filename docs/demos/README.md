# Demo Recordings

Animated GIF demos for the README, recorded via Playwright against the live dev server.

## Recording

```bash
# Prerequisites
npm run dev                          # Start dev server on :5173
npx playwright install chromium      # Ensure browser is installed

# Record all demos
npx tsx scripts/record-demos.ts

# Record a single demo
npx tsx scripts/record-demos.ts consensus
```

## Available Demos

| File                  | Scenario                          | Duration |
| --------------------- | --------------------------------- | -------- |
| `consensus.gif`       | 12-method consensus signal engine | ~8s      |
| `chart.gif`           | Candlestick chart + indicators    | ~10s     |
| `bar-replay.gif`      | Historical bar replay playback    | ~12s     |
| `screener.gif`        | 10K-ticker screener with filters  | ~8s      |
| `signal-dsl.gif`      | Signal DSL with `plot()` output   | ~8s      |
| `macro-dashboard.gif` | FRED macro economic overlay       | ~8s      |

## Requirements

- **ffmpeg** on PATH for mp4 → GIF conversion (800px wide, 10fps, optimized palette)
- Without ffmpeg, `.mp4` files are saved and can be converted manually via [ezgif.com](https://ezgif.com)

## Output

- `.mp4` raw recordings (1280×720, lossless)
- `.gif` optimized animations (800px wide, 10fps, palettegen)
- `.mp4` and `.gif` files are git-ignored; add to releases as artifacts
