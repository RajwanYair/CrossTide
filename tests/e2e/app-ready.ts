/**
 * E2E helper — wait until `main()` has finished its synchronous bootstrap.
 *
 * `#app-version` is populated part-way through `src/main.ts`, so a non-empty
 * value proves the module has executed and the shortcut/router listeners are
 * attached.
 *
 * The obvious guard is subtly wrong:
 *
 * ```ts
 * document.getElementById("app-version")?.textContent !== ""
 * ```
 *
 * When the element does not exist yet the optional chain yields `undefined`,
 * and `undefined !== ""` is `true` — so the wait resolves *immediately*, before
 * the app has booted. Tests then raced the bootstrap and dropped early input
 * (e.g. the `/` shortcut landing before its keydown listener existed).
 */
import type { Page } from "@playwright/test";

/** Resolve once the app shell has booted and rendered its version string. */
export async function waitForAppReady(page: Page, timeout?: number): Promise<void> {
  await page.waitForFunction(
    () => {
      const el = document.getElementById("app-version");
      return el !== null && (el.textContent ?? "").trim() !== "";
    },
    undefined,
    timeout === undefined ? undefined : { timeout },
  );
}
