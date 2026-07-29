import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import starlight from "@astrojs/starlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

/** Convert ```mermaid fenced code blocks into raw `<pre class="mermaid">` HTML
 * nodes so Expressive Code doesn't syntax-highlight them, and mermaid.js can
 * read the untouched diagram source client-side. */
function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node) => {
      if (node.lang !== "mermaid") return;
      const escaped = node.value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      node.type = "html";
      node.value = `<pre class="mermaid">${escaped}</pre>`;
    });
  };
}

export default defineConfig({
  site: "https://rajwanyair.github.io",
  base: "/CrossTide/docs",
  output: "static",
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkMermaid],
      rehypePlugins: [rehypeKatex],
    }),
  },
  integrations: [
    starlight({
      title: "CrossTide",
      description: "CrossTide — multi-method consensus trading indicator library for TypeScript.",
      logo: {
        alt: "CrossTide",
        src: "./src/assets/logo.svg",
      },
      head: [
        {
          tag: "script",
          attrs: { type: "module" },
          content: `
            async function renderMermaidDiagrams() {
              const nodes = document.querySelectorAll("pre.mermaid");
              if (!nodes.length) return;
              const { default: mermaid } = await import(
                "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
              );
              const isDark = document.documentElement.dataset.theme !== "light";
              mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default" });
              await mermaid.run({ nodes });
            }
            renderMermaidDiagrams();
            document.addEventListener("astro:page-load", renderMermaidDiagrams);
          `,
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/RajwanYair/CrossTide",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "index" },
            { label: "Quick Start", slug: "quick-start" },
            { label: "Architecture", slug: "architecture" },
          ],
        },
        {
          label: "User Guides",
          items: [
            { label: "Charts", slug: "charts" },
            { label: "Portfolio", slug: "portfolio" },
            { label: "Watchlist", slug: "watchlist" },
            { label: "Screener", slug: "screener" },
            { label: "Backtest", slug: "backtest" },
            { label: "Alerts", slug: "alerts" },
            { label: "Consensus", slug: "consensus" },
            { label: "Heatmap", slug: "heatmap" },
            { label: "Settings", slug: "settings" },
            { label: "Shortcuts", slug: "shortcuts" },
          ],
        },
        {
          label: "Indicators",
          items: [{ autogenerate: { directory: "indicators" } }],
        },
      ],
      customCss: ["katex/dist/katex.min.css", "./src/styles/custom.css"],
    }),
  ],
});
