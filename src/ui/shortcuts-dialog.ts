/**
 * Keyboard shortcuts dialog — categorized modal showing all shortcuts.
 */

import { openModal } from "./modal";
import { shortcutsByCategory, formatKeys } from "./shortcuts-catalog";
import type { ShortcutCategory } from "./shortcuts-catalog";

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  navigation: "Navigation",
  search: "Search",
  view: "View",
  data: "Data",
  alerts: "Alerts",
  system: "System",
};

export function openShortcutsDialog(): void {
  const content = buildShortcutsContent();
  openModal({ title: "Keyboard Shortcuts", content });
}

function buildShortcutsContent(): HTMLElement {
  const container = document.createElement("div");
  container.className = "shortcuts-dialog";
  container.setAttribute("data-shortcuts-dialog", "");

  const grouped = shortcutsByCategory();
  const categories = Object.keys(grouped) as ShortcutCategory[];

  for (const cat of categories) {
    const shortcuts = grouped[cat];
    if (shortcuts.length === 0) continue;

    const section = document.createElement("section");
    section.className = "shortcuts-section";

    const heading = document.createElement("h3");
    heading.className = "shortcuts-category";
    heading.textContent = CATEGORY_LABELS[cat];
    section.appendChild(heading);

    const list = document.createElement("dl");
    list.className = "shortcuts-list";

    for (const s of shortcuts) {
      const row = document.createElement("div");
      row.className = "shortcuts-row";

      const dt = document.createElement("dt");
      dt.className = "shortcuts-desc";
      dt.textContent = s.description;

      const dd = document.createElement("dd");
      dd.className = "shortcuts-keys";
      for (const key of s.keys) {
        const kbd = document.createElement("kbd");
        kbd.textContent = key;
        dd.appendChild(kbd);
      }
      dd.setAttribute("aria-label", formatKeys(s.keys));

      row.appendChild(dt);
      row.appendChild(dd);
      list.appendChild(row);
    }

    section.appendChild(list);
    container.appendChild(section);
  }

  return container;
}
