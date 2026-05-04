/**
 * Card collapse/expand — allows users to toggle cards to a compact
 * title-only mode. Collapsed state is persisted per card in localStorage.
 */

const STORAGE_KEY = "crosstide-collapsed-cards";

/** Load the set of collapsed card IDs from storage. */
function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function saveCollapsed(collapsed: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));
}

let collapsedCards: Set<string> | null = null;

function getCollapsed(): Set<string> {
  if (!collapsedCards) collapsedCards = loadCollapsed();
  return collapsedCards;
}

/** Check if a card is currently collapsed. */
export function isCardCollapsed(cardId: string): boolean {
  return getCollapsed().has(cardId);
}

/** Toggle collapse state for a card. Returns the new collapsed state. */
export function toggleCardCollapse(cardId: string): boolean {
  const set = getCollapsed();
  if (set.has(cardId)) {
    set.delete(cardId);
  } else {
    set.add(cardId);
  }
  saveCollapsed(set);
  return set.has(cardId);
}

/**
 * Apply collapse state to all cards on the page.
 * Adds a collapse toggle button to each card-header and
 * hides/shows card content accordingly.
 */
export function initCardCollapse(): void {
  const cards = document.querySelectorAll<HTMLElement>(".card");

  for (const card of cards) {
    const header = card.querySelector<HTMLElement>(".card-header");
    if (!header) continue;

    // Derive card ID from the parent section's ID (view-watchlist → watchlist)
    const section = card.closest<HTMLElement>("section.view");
    const cardId = section?.id?.replace("view-", "") ?? "";
    if (!cardId) continue;

    // Skip if already initialized
    if (header.querySelector(".btn-collapse")) continue;

    const collapsed = isCardCollapsed(cardId);
    const btn = document.createElement("button");
    btn.className = "btn-collapse";
    btn.type = "button";
    btn.setAttribute("aria-label", collapsed ? "Expand card" : "Collapse card");
    btn.setAttribute("aria-expanded", String(!collapsed));
    btn.title = collapsed ? "Expand" : "Collapse";
    btn.textContent = collapsed ? "▸" : "▾";
    header.insertBefore(btn, header.firstChild);

    // Get the content area (everything after the header)
    const contentEls = [...card.children].filter((el) => el !== header);
    if (collapsed) {
      for (const el of contentEls) (el as HTMLElement).style.display = "none";
      card.classList.add("card-collapsed");
    }

    btn.addEventListener("click", () => {
      const nowCollapsed = toggleCardCollapse(cardId);
      btn.textContent = nowCollapsed ? "▸" : "▾";
      btn.setAttribute("aria-label", nowCollapsed ? "Expand card" : "Collapse card");
      btn.setAttribute("aria-expanded", String(!nowCollapsed));
      btn.title = nowCollapsed ? "Expand" : "Collapse";

      const siblings = [...card.children].filter((el) => el !== header);
      for (const el of siblings) {
        (el as HTMLElement).style.display = nowCollapsed ? "none" : "";
      }
      card.classList.toggle("card-collapsed", nowCollapsed);
    });
  }
}
