/**
 * Ticker autocomplete dropdown — provides search-as-you-type suggestions.
 *
 * Features:
 * - Debounced input (300ms) to avoid spamming the provider
 * - Keyboard navigation (↑/↓/Enter/Escape)
 * - Highlights matching substring in results
 * - Accessible: role=listbox, aria-activedescendant
 * - Falls back to the offline ticker catalog when the provider rejects or
 *   returns nothing (CORS-restricted static hosting, offline, outage), so the
 *   dropdown never silently stays empty
 */
import type { SearchResult } from "../providers/types";
import { searchTickerCatalog } from "../domain/ticker-catalog";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 8;

/** Local catalog rows mapped onto the provider's SearchResult shape. */
function localResults(query: string): readonly SearchResult[] {
  return searchTickerCatalog(query, MAX_RESULTS).map(
    (e): SearchResult => ({
      symbol: e.symbol,
      name: e.name,
      exchange: e.exchange,
      type: e.type,
    }),
  );
}

/**
 * Merge provider hits with local catalog hits, provider first, de-duplicated
 * by symbol.
 */
function mergeResults(
  remote: readonly SearchResult[],
  local: readonly SearchResult[],
): readonly SearchResult[] {
  const seen = new Set(remote.map((r) => r.symbol.toUpperCase()));
  const merged = [...remote];
  for (const entry of local) {
    if (seen.has(entry.symbol.toUpperCase())) continue;
    seen.add(entry.symbol.toUpperCase());
    merged.push(entry);
  }
  return merged.slice(0, MAX_RESULTS);
}

export interface AutocompleteOptions {
  /** Called to fetch search suggestions from the active data provider. */
  onSearch: (query: string) => Promise<readonly SearchResult[]>;
  /** Called when user selects a result. */
  onSelect: (symbol: string) => void;
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Optional id applied to the inner input element (e.g. to preserve an id across a DOM swap). */
  inputId?: string;
}

export interface AutocompleteHandle {
  /** Focus the input programmatically. */
  focus(): void;
  /** Get the container element. */
  element: HTMLElement;
  /** Dispose event listeners. */
  dispose(): void;
}

/**
 * Create and mount a ticker autocomplete widget.
 */
export function createAutocomplete(options: AutocompleteOptions): AutocompleteHandle {
  const { onSearch, onSelect, placeholder = "Search ticker…", inputId } = options;

  // ── Build DOM ──
  const wrapper = document.createElement("div");
  wrapper.className = "autocomplete-wrapper";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "autocomplete-input";
  input.placeholder = placeholder;
  if (inputId) input.id = inputId;
  input.setAttribute("autocomplete", "off");
  input.setAttribute("spellcheck", "false");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "autocomplete-listbox");

  const listbox = document.createElement("ul");
  listbox.className = "autocomplete-listbox";
  listbox.id = "autocomplete-listbox";
  listbox.setAttribute("role", "listbox");
  listbox.hidden = true;

  wrapper.appendChild(input);
  wrapper.appendChild(listbox);

  // ── State ──
  let results: readonly SearchResult[] = [];
  let activeIndex = -1;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function highlightMatch(text: string, query: string): string {
    const escaped = escapeHtml(text);
    if (!query) return escaped;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escaped;
    const before = escapeHtml(text.slice(0, idx));
    const match = escapeHtml(text.slice(idx, idx + query.length));
    const after = escapeHtml(text.slice(idx + query.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  function renderResults(query: string): void {
    if (results.length === 0) {
      listbox.innerHTML = `<li class="autocomplete-item autocomplete-empty" role="option" aria-selected="false" aria-disabled="true">No matching tickers</li>`;
      listbox.hidden = false;
      input.setAttribute("aria-expanded", "true");
      input.removeAttribute("aria-activedescendant");
      return;
    }

    listbox.innerHTML = results
      .slice(0, MAX_RESULTS)
      .map(
        (r, i) =>
          `<li class="autocomplete-item${i === activeIndex ? " active" : ""}"
              id="autocomplete-item-${i}"
              role="option"
              aria-selected="${i === activeIndex}"
              data-symbol="${escapeHtml(r.symbol)}">
            <span class="autocomplete-symbol">${highlightMatch(r.symbol, query)}</span>
            <span class="autocomplete-name">${highlightMatch(r.name, query)}</span>
            ${r.exchange ? `<span class="autocomplete-exchange">${escapeHtml(r.exchange)}</span>` : ""}
          </li>`,
      )
      .join("");

    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");

    if (activeIndex >= 0) {
      input.setAttribute("aria-activedescendant", `autocomplete-item-${activeIndex}`);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function selectItem(index: number): void {
    const item = results[index];
    if (!item) return;
    input.value = item.symbol;
    listbox.hidden = true;
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
    onSelect(item.symbol);
  }

  function close(): void {
    listbox.hidden = true;
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  }

  // ── Event handlers ──
  function handleInput(): void {
    const query = input.value.trim();
    if (query.length < 1) {
      results = [];
      close();
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const local = localResults(query);
      void onSearch(query)
        .catch(() => [] as readonly SearchResult[])
        .then((remote) => {
          // Ignore a stale response if the user kept typing.
          if (input.value.trim() !== query) return;
          results = mergeResults(remote, local);
          activeIndex = -1;
          renderResults(query);
        });
    }, DEBOUNCE_MS);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && (listbox.hidden || activeIndex < 0)) {
      const symbol = input.value.trim();
      if (symbol) {
        e.preventDefault();
        onSelect(symbol.toUpperCase());
        close();
      }
      return;
    }

    if (listbox.hidden) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, Math.min(results.length, MAX_RESULTS) - 1);
        renderResults(input.value.trim());
        break;
      case "ArrowUp":
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderResults(input.value.trim());
        break;
      case "Enter":
        e.preventDefault();
        selectItem(activeIndex);
        break;
      case "Escape":
        close();
        break;
    }
  }

  function handleClick(e: MouseEvent): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>(".autocomplete-item");
    if (!target) return;
    const symbol = target.dataset["symbol"];
    if (symbol) {
      input.value = symbol;
      close();
      onSelect(symbol);
    }
  }
  function handleBlur(): void {
    // Delay to allow click on listbox item
    setTimeout(close, 200);
  }

  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", handleKeydown);
  input.addEventListener("blur", handleBlur);
  listbox.addEventListener("click", handleClick);

  return {
    focus(): void {
      input.focus();
    },
    element: wrapper,
    dispose(): void {
      clearTimeout(debounceTimer);
      input.removeEventListener("input", handleInput);
      input.removeEventListener("keydown", handleKeydown);
      input.removeEventListener("blur", handleBlur);
      listbox.removeEventListener("click", handleClick);
    },
  };
}
