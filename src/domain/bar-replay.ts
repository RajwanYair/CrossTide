/**
 * Bar Replay — step through historical OHLCV candles with play/pause/speed/seek.
 *
 * R1: Provides a `createBarReplay()` factory for replaying a candle series at
 * configurable speed with step controls. Pure domain logic — no DOM, no I/O.
 *
 * Usage:
 *   const replay = createBarReplay(candles, {
 *     speed: 10,           // 10x speed
 *     onTick: (candle, index, total) => chart.update(candle),
 *     onComplete: () => console.log("done"),
 *   });
 *   replay.play();
 *   // ... later:
 *   replay.pause();
 *   replay.seek(50);
 *   replay.setSpeed(5);
 *   replay.play();
 *   replay.dispose(); // cancel timer on cleanup
 */

import type { Candle } from "./heikin-ashi";

export type { Candle };

// ── Public types ─────────────────────────────────────────────────────────────

/** Callback invoked for each candle tick during playback or manual stepping. */
export type ReplayTickHandler = (candle: Readonly<Candle>, index: number, total: number) => void;

/** Options for `createBarReplay()`. */
export interface ReplayOptions {
  /**
   * Milliseconds between ticks at 1× speed.
   * Actual interval = `intervalMs / speed`.
   * @default 1000
   */
  intervalMs?: number;
  /**
   * Initial playback speed multiplier.
   * 1 = real-time, 10 = 10× faster.
   * @default 1
   */
  speed?: number;
  /**
   * Candle index to start at (0-based).
   * @default 0
   */
  startIndex?: number;
  /** Called once per tick with the current candle and its position. */
  onTick: ReplayTickHandler;
  /**
   * Called when the last candle has been emitted.
   * Playback stops automatically.
   */
  onComplete?: () => void;
}

/** Read-only snapshot of the current replay state. */
export interface ReplayState {
  /** Whether playback is currently running. */
  readonly isPlaying: boolean;
  /** Current candle index (0-based, clipped to `[0, total - 1]`). */
  readonly currentIndex: number;
  /** Total number of candles in the series. */
  readonly total: number;
  /** Current playback speed multiplier. */
  readonly speed: number;
  /** Completion ratio in `[0, 1]`. `0` at index 0, `1` after the last candle. */
  readonly progress: number;
}

/** Handle returned by `createBarReplay()`. */
export interface BarReplay {
  /** Start or resume playback from the current position. No-op if already playing or at end. */
  play(): void;
  /** Pause playback. No-op if already paused. */
  pause(): void;
  /** Advance one candle and emit `onTick`. Pauses ongoing playback before stepping. */
  step(): void;
  /**
   * Seek to a specific candle index without changing the playing state.
   * Clamped to `[0, total - 1]`. Emits `onTick` for the candle at `index`.
   */
  seek(index: number): void;
  /** Reset to `startIndex` and pause. Emits `onTick` for the first candle if series is non-empty. */
  reset(): void;
  /**
   * Set the playback speed multiplier. Takes effect immediately (restarts the
   * internal timer when playing).
   * @param speed — Positive number. Clamped to [0.1, 100].
   */
  setSpeed(speed: number): void;
  /** Returns a read-only snapshot of the current state. */
  getState(): ReplayState;
  /** Cancel any pending timer and release references. Safe to call multiple times. */
  dispose(): void;
}

// ── Implementation ────────────────────────────────────────────────────────────

const MIN_SPEED = 0.1;
const MAX_SPEED = 100;
const DEFAULT_INTERVAL_MS = 1000;

/**
 * Create a bar-replay controller for a candle series.
 *
 * @param candles   - Ordered OHLCV candles (oldest first).
 * @param opts      - Replay options including the tick callback.
 * @returns A `BarReplay` handle with play/pause/step/seek/reset/setSpeed/dispose.
 */
export function createBarReplay(candles: readonly Candle[], opts: ReplayOptions): BarReplay {
  const total = candles.length;
  const baseIntervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const startIndex = Math.max(0, Math.min(opts.startIndex ?? 0, total - 1));

  let currentIndex = startIndex;
  let speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, opts.speed ?? 1));
  let isPlaying = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function effectiveInterval(): number {
    return baseIntervalMs / speed;
  }

  function cancelTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function emit(index: number): void {
    const candle = candles[index];
    if (candle !== undefined) {
      opts.onTick(candle, index, total);
    }
  }

  function scheduleNext(): void {
    if (disposed || !isPlaying) return;
    timer = setTimeout(() => {
      if (disposed || !isPlaying) return;
      const next = currentIndex + 1;
      if (next >= total) {
        // Reached the end
        isPlaying = false;
        timer = null;
        opts.onComplete?.();
        return;
      }
      currentIndex = next;
      emit(currentIndex);
      scheduleNext();
    }, effectiveInterval());
  }

  // Emit the first candle immediately on creation so consumers see the initial state.
  if (total > 0) {
    emit(currentIndex);
  }

  const replay: BarReplay = {
    play(): void {
      if (disposed || isPlaying || currentIndex >= total - 1) return;
      isPlaying = true;
      scheduleNext();
    },

    pause(): void {
      if (!isPlaying) return;
      isPlaying = false;
      cancelTimer();
    },

    step(): void {
      if (disposed) return;
      // Pause ongoing playback before stepping
      if (isPlaying) {
        isPlaying = false;
        cancelTimer();
      }
      const next = currentIndex + 1;
      if (next >= total) {
        opts.onComplete?.();
        return;
      }
      currentIndex = next;
      emit(currentIndex);
    },

    seek(index: number): void {
      if (disposed) return;
      const clamped = Math.max(0, Math.min(index, total - 1));
      currentIndex = clamped;
      if (total > 0) {
        emit(currentIndex);
      }
      // Restart timer if currently playing so interval resets cleanly
      if (isPlaying) {
        cancelTimer();
        scheduleNext();
      }
    },

    reset(): void {
      if (disposed) return;
      isPlaying = false;
      cancelTimer();
      currentIndex = startIndex;
      if (total > 0) {
        emit(currentIndex);
      }
    },

    setSpeed(newSpeed: number): void {
      speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, newSpeed));
      if (isPlaying) {
        // Restart timer at new interval
        cancelTimer();
        scheduleNext();
      }
    },

    getState(): ReplayState {
      return {
        isPlaying,
        currentIndex,
        total,
        speed,
        progress: total <= 1 ? 1 : currentIndex / (total - 1),
      };
    },

    dispose(): void {
      disposed = true;
      isPlaying = false;
      cancelTimer();
    },
  };

  return replay;
}
