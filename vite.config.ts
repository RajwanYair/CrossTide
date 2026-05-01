import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
  version: string;
};

// In GitHub Actions CI set GITHUB_ACTIONS=true automatically.
// Locally the app is served from the root path.
const isCI = process.env["GITHUB_ACTIONS"] === "true";
const BASE = process.env["VITE_BASE"] ?? (isCI ? "/CrossTide/" : "/");

export default defineConfig({
  // GitHub Pages serves the app from /CrossTide/ (repo name).
  // Local dev uses / so the dev server stays at localhost:<port>/.
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // A17: Telemetry env vars — undefined by default; set in CI / .env.local
    __PLAUSIBLE_URL__: JSON.stringify(process.env["VITE_PLAUSIBLE_URL"] ?? ""),
    __PLAUSIBLE_SITE__: JSON.stringify(process.env["VITE_PLAUSIBLE_SITE"] ?? ""),
    __GLITCHTIP_DSN__: JSON.stringify(process.env["VITE_GLITCHTIP_DSN"] ?? ""),
    // E2: Worker API base URL — override in .env.local for local Worker dev
    __WORKER_BASE_URL__: JSON.stringify(
      process.env["VITE_WORKER_BASE_URL"] ?? "https://worker.crosstide.pages.dev",
    ),
  },
  build: {
    target: "es2022",
    sourcemap: true,
    minify: "oxc",
    outDir: "dist",
    rollupOptions: {
      input: {
        index: resolve("index.html"),
        sw: resolve("src/sw.ts"),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === "sw" ? "[name].js" : "assets/[name]-[hash].js"),
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    // Proxy Yahoo Finance through the Vite dev server to avoid CORS and external
    // CORS-proxy dependencies.  All /api/yahoo/* requests are forwarded to
    // query1.finance.yahoo.com by Node.js, which honours HTTPS_PROXY / HTTP_PROXY
    // env vars if set (useful behind corporate firewalls).
    proxy: {
      "/api/yahoo": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        // Strip the /api/yahoo prefix so the upstream URL is unchanged
        rewrite: (path: string) => path.replace(/^\/api\/yahoo/, ""),
        secure: true,
      },
    },
    headers: {
      // Mirrors public/_headers — source of truth: src/core/csp-builder.ts
      // In dev all Yahoo requests go through the Vite proxy (/api/yahoo → same-origin)
      // so query1.finance.yahoo.com does NOT need to be in connect-src here.
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://finnhub.io https://www.alphavantage.co https://api.coingecko.com wss://ws.finnhub.io; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Permissions-Policy":
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
    // Also proxy Yahoo Finance for `vite preview` builds served locally
    proxy: {
      "/api/yahoo": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/yahoo/, ""),
        secure: true,
      },
    },
    headers: {
      // Mirrors public/_headers — source of truth: src/core/csp-builder.ts
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://finnhub.io https://www.alphavantage.co https://api.coingecko.com wss://ws.finnhub.io https://corsproxy.io; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Permissions-Policy":
        "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    },
  },
});
