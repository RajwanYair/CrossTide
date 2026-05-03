import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HttpsProxyAgent } from "https-proxy-agent";

const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
  version: string;
};

// In GitHub Actions CI set GITHUB_ACTIONS=true automatically.
// Locally the app is served from the root path.
const isCI = process.env["GITHUB_ACTIONS"] === "true";
const BASE = process.env["VITE_BASE"] ?? (isCI ? "/CrossTide/" : "/");

// Corporate proxy agent — used by Vite's http-proxy to tunnel outbound requests
const PROXY_URL = process.env["HTTPS_PROXY"] || process.env["HTTP_PROXY"] || "";
const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

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
    // E2: Worker API base URL — in dev, route through Vite proxy to avoid CORS/firewall
    __WORKER_BASE_URL__: JSON.stringify(
      process.env["VITE_WORKER_BASE_URL"] ??
        (isCI ? "https://worker.crosstide.pages.dev" : "/api/worker"),
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
    // Proxy external APIs through the Vite dev server to avoid CORS and external
    // CORS-proxy dependencies. Node.js honours HTTPS_PROXY / HTTP_PROXY env vars
    // when using https-proxy-agent (useful behind corporate firewalls).
    proxy: {
      "/api/yahoo": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/yahoo/, ""),
        secure: !proxyAgent,
        agent: proxyAgent,
      },
      "/api/stooq": {
        target: "https://stooq.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/stooq/, ""),
        secure: !proxyAgent,
        agent: proxyAgent,
      },
      "/api/worker": {
        target: "https://worker.crosstide.pages.dev",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/worker/, ""),
        secure: !proxyAgent,
        agent: proxyAgent,
      },
    },
    headers: {
      // In dev all API requests go through the Vite proxy (/api/*), so connect-src
      // only needs 'self'. External URLs kept for WebSocket (Finnhub).
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://worker.crosstide.pages.dev wss://ws.finnhub.io; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
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
        secure: !proxyAgent,
        agent: proxyAgent,
      },
      "/api/stooq": {
        target: "https://stooq.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/stooq/, ""),
        secure: !proxyAgentxyAgent,
        agent: proxyAgent,
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
