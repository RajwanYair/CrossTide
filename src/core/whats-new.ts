/**
 * "What's New" dialog — shows release highlights when the app version changes.
 *
 * Stores the last-seen version in localStorage. On startup, if the current
 * version differs, displays a modal with release notes.
 */
import { openModal } from "../ui/modal";

const VERSION_KEY = "crosstide_last_seen_version";

/** Current app version — injected at build time via Vite define or import.meta. */
export const APP_VERSION = __APP_VERSION__;

export interface WhatsNewEntry {
  readonly version: string;
  readonly highlights: readonly string[];
}

/**
 * Registry of "What's New" entries. Most recent first.
 * Add a new entry at the top when releasing a version.
 */
export const WHATS_NEW: readonly WhatsNewEntry[] = [
  {
    version: "11.6.0",
    highlights: [
      "Offline indicator — visual banner when connectivity is lost",
      "Language picker — switch between EN, ES, DE, ZH, HE in settings",
      "Drawing undo/redo — Ctrl+Z / Ctrl+Y for chart annotations",
      "Service worker update prompt — auto-detects new versions",
      "Improved documentation — plugin API and card guides",
    ],
  },
  {
    version: "11.5.0",
    highlights: [
      "Zero innerHTML violations remaining (R14 complete)",
      "Container queries for responsive cards (K8/R16)",
      "WCAG audit expanded to 23 routes",
      "Virtual scroller stress tested at 10K rows",
      "Lighthouse Web Vitals in PR comments",
      "Mobile responsive e2e across 5 viewports",
      "Toast dismiss button with keyboard a11y",
      "GitHub issue templates (bug + feature request)",
    ],
  },
];

function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
}

function setLastSeenVersion(version: string): void {
  try {
    localStorage.setItem(VERSION_KEY, version);
  } catch {
    // ignore storage errors
  }
}

/**
 * Check if version changed and show the "What's New" modal.
 * Call once at app startup.
 */
export function checkWhatsNew(): void {
  const lastSeen = getLastSeenVersion();
  setLastSeenVersion(APP_VERSION);

  if (!lastSeen || lastSeen === APP_VERSION) return;

  // Find entries newer than lastSeen
  const newEntries = WHATS_NEW.filter((e) => e.version > lastSeen);
  if (newEntries.length === 0) return;

  const content = document.createElement("div");
  content.className = "whats-new-content";

  for (const entry of newEntries) {
    const section = document.createElement("section");
    const h3 = document.createElement("h3");
    h3.textContent = `v${entry.version}`;
    section.appendChild(h3);

    const ul = document.createElement("ul");
    for (const item of entry.highlights) {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    }
    section.appendChild(ul);
    content.appendChild(section);
  }

  openModal({ title: "What's New", content });
}
