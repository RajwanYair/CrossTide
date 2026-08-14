/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

// G3: TS 6.0 requires explicit declarations for CSS-only side-effect imports
// @fontsource-variable/inter ships no .d.ts; declare the module to satisfy TS2882.
declare module "@fontsource-variable/inter" {}

// G8: Navigation API — TS lib.dom.d.ts types window.navigation as `string` (legacy),
// which conflicts with the modern Navigation interface. Re-declare as optional so
// "navigation" in window narrowing works correctly in both branches.
interface Window {
  navigation?: Navigation;
  __crosstidePerformanceMetrics?: () => import("./core/perf-metrics").PerfMetrics;
}

// H7: Background Fetch API — minimal type stubs (not yet in lib.dom.d.ts).
interface BackgroundFetchRegistration extends EventTarget {
  readonly id: string;
  readonly uploaded: number;
  readonly uploadTotal: number;
  readonly downloaded: number;
  readonly downloadTotal: number;
  readonly result: "" | "success" | "failure";
  readonly failureReason: string;
  readonly recordsAvailable: boolean;
  abort(): Promise<boolean>;
  matchAll(filter?: RequestInfo): Promise<BackgroundFetchRecord[]>;
}
interface BackgroundFetchRecord {
  readonly request: Request;
  readonly responseReady: Promise<Response>;
}
interface BackgroundFetchManager {
  fetch(
    id: string,
    requests: RequestInfo | RequestInfo[],
    options?: BackgroundFetchOptions,
  ): Promise<BackgroundFetchRegistration>;
  get(id: string): Promise<BackgroundFetchRegistration | undefined>;
  getIds(): Promise<string[]>;
}
interface BackgroundFetchOptions {
  icons?: { src: string; sizes: string; type: string }[];
  title?: string;
  downloadTotal?: number;
}
