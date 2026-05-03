/**
 * Alert notification sound module.
 *
 * Plays a short synthesized tone using the Web Audio API when an alert fires.
 * No external audio files needed — generates a pleasant two-tone chime
 * programmatically. Respects user preference stored in localStorage.
 */

const STORAGE_KEY = "crosstide-alert-sound-enabled";

let audioCtx: AudioContext | null = null;

/** Get or lazily create the AudioContext (must be after user gesture). */
function getAudioContext(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Check if the user has enabled alert sounds. Defaults to true. */
export function isAlertSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val !== "false";
  } catch {
    return true;
  }
}

/** Toggle alert sound preference. */
export function setAlertSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

/**
 * Play a short two-tone chime (C5 → E5) for alert notifications.
 * Duration: ~300ms. Volume: moderate (0.3 gain).
 * No-op if sound is disabled or AudioContext is unavailable.
 */
export function playAlertSound(): void {
  if (!isAlertSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (autoplay policy)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;

  // ── Tone 1: C5 (523 Hz) ──
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = 523.25;
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);

  // ── Tone 2: E5 (659 Hz) — starts after first tone ──
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = 659.25;
  gain2.gain.setValueAtTime(0.3, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.3);
}

/** Tear down the audio context (for tests or cleanup). */
export function disposeAlertSound(): void {
  if (audioCtx) {
    void audioCtx.close();
    audioCtx = null;
  }
}
