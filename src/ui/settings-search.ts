/**
 * Settings search/filter — adds a search input above the settings card
 * content that filters setting groups by keyword match.
 *
 * Matches against label text, option text, and group content.
 */

/**
 * Initialize settings search on the given container.
 * Adds a search input at the top and filters .setting-group elements.
 * Returns a cleanup function.
 */
export function initSettingsSearch(container: HTMLElement): () => void {
  // Don't add if already present
  if (container.querySelector(".settings-search")) return () => {};

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "settings-search";
  searchInput.placeholder = "Search settings…";
  searchInput.setAttribute("aria-label", "Filter settings");

  container.insertBefore(searchInput, container.firstChild);

  function filter(): void {
    const query = searchInput.value.trim().toLowerCase();
    const groups = container.querySelectorAll<HTMLElement>(".setting-group");

    for (const group of groups) {
      if (!query) {
        group.style.display = "";
        continue;
      }
      const text = group.textContent?.toLowerCase() ?? "";
      const matchesLabel = text.includes(query);
      // Also check select options and button text
      const inputs = group.querySelectorAll("select, button, label, input");
      let matchesInput = false;
      for (const input of inputs) {
        if ((input.textContent ?? "").toLowerCase().includes(query)) {
          matchesInput = true;
          break;
        }
        if (input instanceof HTMLSelectElement) {
          for (const opt of input.options) {
            if (opt.text.toLowerCase().includes(query)) {
              matchesInput = true;
              break;
            }
          }
        }
      }
      group.style.display = matchesLabel || matchesInput ? "" : "none";
    }
  }

  searchInput.addEventListener("input", filter);

  return (): void => {
    searchInput.removeEventListener("input", filter);
    searchInput.remove();
  };
}
