/**
 * Vite library build for `@crosstide/domain`.
 *
 * The domain layer is bundled rather than transpiled file-by-file because its
 * modules import each other with extensionless specifiers, which Node's ESM
 * resolver rejects. A single ESM bundle sidesteps the question entirely, and
 * `sideEffects: false` keeps the package tree-shakable for consumers.
 *
 * @module packages/domain/vite.config
 */

import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL("../../src/domain/index.ts", import.meta.url)),
        browser: fileURLToPath(new URL("../../src/domain/browser-index.ts", import.meta.url)),
      },
      formats: ["es"],
      fileName: (_format, entryName): string => `${entryName}.js`,
    },
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    target: "es2022",
    sourcemap: true,
    reportCompressedSize: false,
  },
});
