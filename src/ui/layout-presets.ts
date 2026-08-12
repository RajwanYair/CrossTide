/** Restore the active dashboard layout preset into the application shell. */
import { getActivePreset, getPreset } from "../core/layout-presets";

function sectionId(card: string): string {
  return card.startsWith("view-") ? card : `view-${card}`;
}

/**
 * Restore the active preset's section order while retaining sections it does
 * not mention, including sections added after the preset was saved.
 */
export function restoreActiveLayoutPreset(root?: HTMLElement): boolean {
  const activeName = getActivePreset();
  if (!activeName) return false;

  const preset = getPreset(activeName);
  if (!preset) return false;

  const container = root ?? document.getElementById("app-main");
  if (!container) return false;

  const sections = [...container.children].filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.classList.contains("view"),
  );
  const byId = new Map(sections.map((section) => [section.id, section]));
  const orderedIds = [...preset.cards.map(sectionId), ...sections.map((section) => section.id)];
  const ordered = [...new Set(orderedIds)]
    .map((id) => byId.get(id))
    .filter((section): section is HTMLElement => section !== undefined);

  for (const section of ordered) container.appendChild(section);
  return ordered.length > 0;
}
