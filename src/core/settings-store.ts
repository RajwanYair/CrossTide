/**
 * Settings Store — manages user preferences with signal store pattern.
 *
 * P6: Structured store for theme, locale, layout, and feature flags.
 */

import { createPersistedStore } from "./store";

export interface SettingsState {
  theme: "system" | "light" | "dark";
  locale: string;
  palette: string;
  compactMode: boolean;
  animationsEnabled: boolean;
  finnhubKey: string;
  defaultRange: string;
  defaultInterval: string;
  showVolume: boolean;
  showGrid: boolean;
}

const INITIAL: SettingsState = {
  theme: "system",
  locale: "en",
  palette: "default",
  compactMode: false,
  animationsEnabled: true,
  finnhubKey: "",
  defaultRange: "1y",
  defaultInterval: "1d",
  showVolume: true,
  showGrid: true,
};

export const settingsStore = createPersistedStore<
  SettingsState,
  {
    setTheme: (theme: SettingsState["theme"]) => void;
    setLocale: (locale: string) => void;
    setPalette: (palette: string) => void;
    toggleCompact: () => void;
    toggleAnimations: () => void;
    setFinnhubKey: (key: string) => void;
    setDefaultRange: (range: string) => void;
    setDefaultInterval: (interval: string) => void;
    toggleVolume: () => void;
    toggleGrid: () => void;
    patch: (partial: Partial<SettingsState>) => void;
  }
>("ct:settings", INITIAL, (get, set) => ({
  setTheme: (theme): void => set({ theme }),
  setLocale: (locale): void => set({ locale }),
  setPalette: (palette): void => set({ palette }),
  toggleCompact: (): void => set({ compactMode: !get().compactMode }),
  toggleAnimations: (): void => set({ animationsEnabled: !get().animationsEnabled }),
  setFinnhubKey: (key): void => set({ finnhubKey: key }),
  setDefaultRange: (range): void => set({ defaultRange: range }),
  setDefaultInterval: (interval): void => set({ defaultInterval: interval }),
  toggleVolume: (): void => set({ showVolume: !get().showVolume }),
  toggleGrid: (): void => set({ showGrid: !get().showGrid }),
  patch: (partial): void => set(partial),
}));
