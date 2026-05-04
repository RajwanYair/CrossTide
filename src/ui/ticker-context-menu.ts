/**
 * Contextual ticker actions menu — context menu for ticker rows.
 *
 * Displays a custom right-click/long-press menu with actions like:
 * - View chart
 * - Add/remove from watchlist
 * - Set color tag
 * - Add note
 * - Copy ticker
 */

export interface TickerAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly handler: (ticker: string) => void;
}

let menuEl: HTMLElement | null = null;
let currentTicker = "";
let registeredActions: TickerAction[] = [];

function createMenu(): HTMLElement {
  const el = document.createElement("div");
  el.className = "ticker-context-menu";
  el.setAttribute("role", "menu");
  el.style.display = "none";
  document.body.appendChild(el);
  return el;
}

function positionMenu(el: HTMLElement, x: number, y: number): void {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  // Ensure menu stays in viewport
  const rect = el.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    el.style.left = `${window.innerWidth - rect.width - 8}px`;
  }
  if (rect.bottom > window.innerHeight) {
    el.style.top = `${window.innerHeight - rect.height - 8}px`;
  }
}

function renderMenu(ticker: string): void {
  if (!menuEl) return;
  currentTicker = ticker;
  menuEl.innerHTML =
    `<div class="context-menu-header">${ticker}</div>` +
    registeredActions
      .map(
        (a) =>
          `<button class="context-menu-item" data-action-id="${a.id}" role="menuitem">${a.icon ? `<span class="context-menu-icon">${a.icon}</span>` : ""}${a.label}</button>`,
      )
      .join("");
}

function show(ticker: string, x: number, y: number): void {
  if (!menuEl) menuEl = createMenu();
  renderMenu(ticker);
  menuEl.style.display = "block";
  positionMenu(menuEl, x, y);
}

function hide(): void {
  if (menuEl) menuEl.style.display = "none";
  currentTicker = "";
}

function onClickOutside(e: MouseEvent): void {
  if (menuEl && !menuEl.contains(e.target as Node)) {
    hide();
  }
}

function onMenuClick(e: Event): void {
  const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action-id]");
  if (!target) return;
  const actionId = target.dataset.actionId;
  const action = registeredActions.find((a) => a.id === actionId);
  if (action && currentTicker) {
    action.handler(currentTicker);
  }
  hide();
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === "Escape") hide();
}

/**
 * Register actions for the context menu.
 */
export function registerTickerActions(actions: readonly TickerAction[]): void {
  registeredActions = [...actions];
}

/**
 * Get currently registered actions.
 */
export function getRegisteredActions(): readonly TickerAction[] {
  return registeredActions;
}

/**
 * Show the context menu for a ticker at the given position.
 */
export function showTickerMenu(ticker: string, x: number, y: number): void {
  show(ticker, x, y);
}

/**
 * Hide the context menu.
 */
export function hideTickerMenu(): void {
  hide();
}

/**
 * Initialize the ticker context menu system.
 * Returns a cleanup function.
 */
export function initTickerContextMenu(): () => void {
  menuEl = createMenu();

  document.addEventListener("click", onClickOutside);
  document.addEventListener("keydown", onKeyDown);
  menuEl.addEventListener("click", onMenuClick);

  return (): void => {
    document.removeEventListener("click", onClickOutside);
    document.removeEventListener("keydown", onKeyDown);
    menuEl?.removeEventListener("click", onMenuClick);
    menuEl?.remove();
    menuEl = null;
    registeredActions = [];
    currentTicker = "";
  };
}
