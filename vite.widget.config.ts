/**
 * Vite build for the embeddable CrossTide widget bundle.
 *
 * The main app build targets `index.html` + `src/sw.ts`, but E21 needs a
 * stable `<script type="module" src=".../widget.mjs">` artifact that third
 * parties can reference directly. Building it separately keeps the filename
 * stable while still letting the app and the widget share the same TS source.
 */
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve("src/ui/widget.ts"),
      formats: ["es"],
      fileName: (): string => "widget.mjs",
    },
    outDir: "dist",
    emptyOutDir: false,
    target: "es2022",
    sourcemap: true,
    minify: "oxc",
    cssMinify: "esbuild",
    reportCompressedSize: false,
  },
});
