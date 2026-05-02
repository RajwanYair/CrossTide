/**
 * Card settings reactive store (G24).
 *
 * Keeps per-card settings in a signal so cards can react to updates without
 * page reload. The persisted source of truth remains AppConfig in localStorage.
 */
import { signal } from "./signals";
import type { CardId, CardSettingsMap } from "../types/domain";

const cardSettingsSignal = signal<CardSettingsMap>({});

export function hydrateCardSettings(settings: CardSettingsMap | undefined): void {
  cardSettingsSignal.set(settings ?? {});
}

export function updateCardSettingsSignal<K extends CardId>(
  cardId: K,
  settings: NonNullable<CardSettingsMap[K]>,
): void {
  cardSettingsSignal.update((prev) => ({ ...prev, [cardId]: settings }));
}

export function getCardSettingsSignal<K extends CardId>(cardId: K): CardSettingsMap[K] | undefined {
  return cardSettingsSignal.peek()[cardId];
}

export function onCardSettingsChange<K extends CardId>(
  cardId: K,
  cb: (settings: CardSettingsMap[K] | undefined) => void,
): () => void {
  return cardSettingsSignal.subscribe((all) => {
    cb(all[cardId]);
  });
}
