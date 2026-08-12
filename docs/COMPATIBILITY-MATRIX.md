# Browser Compatibility Matrix

This matrix describes the browser and capability coverage CrossTide verifies.
The application uses progressive enhancement: an optional API may be absent,
but detection must not prevent the core shell and local workflows from loading.

## Browser Projects

| Target | Verification | Support contract |
| --- | --- | --- |
| Chromium | Vitest browser and Playwright `chromium` | Full supported desktop baseline |
| Firefox | Vitest browser and Playwright `firefox` | Full supported desktop baseline |
| WebKit | Vitest browser and Playwright `webkit` | Full supported Safari baseline |
| Edge | Vitest opt-in and Playwright `edge` | Chromium-compatible desktop support |
| Samsung Internet | Vitest opt-in with Samsung UA | Chromium-compatible mobile support |
| Mobile Chrome | Playwright `mobile-chrome`, `mobile-chrome-landscape` | Touch and narrow viewport support |
| Mobile Safari | Playwright `mobile-safari`, `mobile-safari-pro`, `mobile-safari-landscape`, `mobile-safari-mini` | Touch, safe-area, and narrow viewport support |
| Android Chromium | Playwright `android-galaxy`, `android-galaxy-s24`, `android-galaxy-landscape`, `android-galaxy-a55`, `android-galaxy-a55-landscape` | Touch and Android viewport support |
| Firefox Android | Playwright `firefox-android`, `firefox-android-landscape` | Gecko mobile progressive enhancement |
| Tablets | Playwright `tablet`, `tablet-landscape`, `tablet-pro`, `tablet-pro-landscape`, `android-tablet`, `android-tablet-s9`, `android-tablet-landscape`, `nexus-10` | Touch, orientation, and tablet layout support |

The authoritative browser target list is `.browserslistrc`. The Playwright
projects and Vitest browser instances are the executable coverage for this
matrix; browser-specific user-agent behavior is not used to gate core features.

## Capability Contracts

| Capability | Required behavior | Verification |
| --- | --- | --- |
| Core Web APIs | `fetch`, abort, URL, crypto, encoding, observers, and animation APIs work | `cross-browser-compat.browser.test.ts` |
| Storage | Local/session storage, IndexedDB, and Cache API work when available; blocked storage falls back safely | `cross-browser-compat.browser.test.ts`, `session-state.test.ts` |
| Private browsing and storage pressure | Persistence failures do not crash route loading or cleanup | `session-state.test.ts`, `retry-storage-coverage.test.ts` |
| Reduced motion | Motion preference is detectable and animated behavior can be reduced | `mobile-compat.browser.test.ts`, `responsive.spec.ts` |
| Reduced data | `saveData` is optional and safe to inspect | `mobile-compat.browser.test.ts` |
| Battery | Battery API is optional and safe to detect | `mobile-compat.browser.test.ts` |
| Touch and orientation | Pointer, touch detection, viewport units, safe areas, and orientation queries do not throw | `mobile-compat.browser.test.ts` |
| Missing optional APIs | Clipboard, sharing, popover, notification, and idle callbacks degrade without throwing | `cross-browser-compat.browser.test.ts`, `mobile-compat.browser.test.ts` |
