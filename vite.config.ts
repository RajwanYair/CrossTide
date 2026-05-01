import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
  version: string;
};

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
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
    headers: {
      // Mirrors public/_headers — source of truth: src/core/csp-builder.ts
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://finnhub.io https://query1.finance.yahoo.com https://www.alphavantage.co https://api.coingecko.com wss://ws.finnhub.io; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
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
    headers: {
      // Mirrors public/_headers — source of truth: src/core/csp-builder.ts
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://finnhub.io https://query1.finance.yahoo.com https://www.alphavantage.co https://api.coingecko.com wss://ws.finnhub.io; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
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
