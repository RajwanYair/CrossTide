/**
 * Theme management — dark/light toggle.
 */

export type Theme = "dark" | "light";

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset["theme"] = theme;
}

export function initTheme(theme: Theme): void {
  applyTheme(theme);

  const select = document.getElementById("theme-select") as HTMLSelectElement | null;
  if (select) {
    select.value = theme;
    select.addEventListener("change", () => {
      applyTheme(select.value as Theme);
    });
  }
}
