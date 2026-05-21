/**
 * Sidebar toggle — hamburger button collapses/expands the navigation sidebar.
 * Handles both mobile (overlay) and desktop (collapsed rail) states.
 */
import { enableRovingTabindex } from "./roving-tabindex";

export function initSidebarToggle(): void {
  const toggle = document.getElementById("sidebar-toggle") as HTMLButtonElement | null;
  const nav = document.getElementById("app-nav");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!toggle || !nav) return;

  const t = toggle;
  const n = nav;

  const isMobile = (): boolean => window.matchMedia("(max-width: 767px)").matches;

  function closeSidebar(): void {
    if (isMobile()) {
      n.classList.remove("sidebar-open");
      backdrop?.classList.remove("visible");
    } else {
      n.classList.add("sidebar-collapsed");
    }
    t.setAttribute("aria-expanded", "false");
  }

  function openSidebar(): void {
    if (isMobile()) {
      n.classList.add("sidebar-open");
      backdrop?.classList.add("visible");
    } else {
      n.classList.remove("sidebar-collapsed");
    }
    t.setAttribute("aria-expanded", "true");
  }

  // On mobile, start collapsed
  if (isMobile()) {
    n.classList.remove("sidebar-open");
    t.setAttribute("aria-expanded", "false");
  }

  t.addEventListener("click", () => {
    const expanded = t.getAttribute("aria-expanded") === "true";
    if (expanded) closeSidebar();
    else openSidebar();
  });

  // Close on backdrop click
  backdrop?.addEventListener("click", closeSidebar);

  // Close sidebar on mobile after a nav-link is clicked
  n.addEventListener("click", (e: MouseEvent) => {
    if (isMobile() && (e.target as HTMLElement).closest(".nav-link")) {
      closeSidebar();
    }
  });

  // Enable roving tabindex: arrow keys navigate between nav links (Q13)
  enableRovingTabindex(n, {
    selector: ".nav-link",
    orientation: "vertical",
    wrap: true,
  });
}
