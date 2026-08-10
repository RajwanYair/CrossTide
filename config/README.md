# Configuration Placement

CrossTide uses one placement rule for tool configuration:

- Keep root-level files that tools discover automatically or that define a project entry point at the repository root. This includes `biome.json`, `eslint.config.mjs`, `playwright.config.ts`, `tsconfig*.json`, `vite*.config.ts`, `vitest*.config.ts`, and `wrangler.toml`.
- Keep auxiliary tool configuration in `config/` when the command invokes it with an explicit `--config`, `--configFile`, or environment-variable path. This includes lint, HTML, Markdown, commitlint, Lighthouse, mutation, and security scanner configuration.
- Keep package-specific configuration inside the package that owns it, such as `worker/tsconfig.json`, `docs-site/tsconfig.json`, and `packages/domain/tsconfig.build.json`.

Do not move a root-discovered file into `config/` without updating the tool invocation and its quality gates. Do not add a second copy of a configuration file to make a tool discover it.
