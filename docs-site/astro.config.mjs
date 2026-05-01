import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://rajwanyair.github.io",
  base: "/CrossTide/docs",
  integrations: [
    starlight({
      title: "CrossTide",
      description:
        "CrossTide — multi-method consensus trading indicator library for TypeScript.",
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
          label: "Indicators",
          autogenerate: { directory: "indicators" },
        },
        {
          label: "Core Utilities",
          autogenerate: { directory: "core" },
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
