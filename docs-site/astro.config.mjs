import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://rajwanyair.github.io",
  base: "/CrossTide/docs",
  integrations: [
    starlight({
      title: "CrossTide",
      description: "CrossTide — multi-method consensus trading indicator library for TypeScript.",
      logo: {
        alt: "CrossTide",
        src: "./src/assets/logo.svg",
      },
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
          autogenerate: { directory: "indicators" },
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
