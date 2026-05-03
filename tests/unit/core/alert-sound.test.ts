/**
 * Alert sound module tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isAlertSoundEnabled,
  setAlertSoundEnabled,
  playAlertSound,
  disposeAlertSound,
} from "../../../src/core/alert-sound";

function storageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("alert-sound", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
    disposeAlertSound();
  });

  it("defaults to enabled", () => {
    expect(isAlertSoundEnabled()).toBe(true);
  });

  it("can be disabled and re-enabled", () => {
    setAlertSoundEnabled(false);
    expect(isAlertSoundEnabled()).toBe(false);

    setAlertSoundEnabled(true);
    expect(isAlertSoundEnabled()).toBe(true);
  });

  it("persists preference in localStorage", () => {
    setAlertSoundEnabled(false);
    expect(localStorage.getItem("crosstide-alert-sound-enabled")).toBe("false");
  });

  it("playAlertSound does not throw when AudioContext unavailable", () => {
    // happy-dom may not have AudioContext — should be a silent no-op
    expect(() => playAlertSound()).not.toThrow();
  });

  it("playAlertSound is a no-op when disabled", () => {
    setAlertSoundEnabled(false);
    // Mock AudioContext to detect if it's called
    const mockOsc = {
      type: "",
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const mockGain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
    const mockCtx = {
      currentTime: 0,
      state: "running",
      destination: {},
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      resume: vi.fn(),
      close: vi.fn(),
    };
    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => mockCtx),
    );

    playAlertSound();
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
