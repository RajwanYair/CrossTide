# ADR-0013: Divide Formatting and Linting Between Biome and Oxlint

## Status

Accepted

## Context

The repository needs fast, deterministic formatting and type-aware JavaScript and TypeScript linting. One tool does not provide the desired combination without adding avoidable runtime or configuration cost.

## Decision

Biome owns formatting and basic syntax/style checks. Oxlint, with its TypeScript 7-aware checker, owns JavaScript and TypeScript linting. The architecture checker owns import direction, while Stylelint, HTMLHint, and markdownlint retain ownership of their respective file formats.

Declared tools are invoked from the lockfile-installed binaries; CI installs with `npm ci --ignore-scripts`.

## Consequences

- `npm run format:check` is the formatting contract.
- `npm run lint` is the JavaScript and TypeScript lint contract.
- TypeScript validation uses the native TypeScript compiler; no linter integration may depend on the removed compiler API.
- Markdown is formatted and linted by markdownlint, not Biome.
- Rules are not duplicated across formatters and linters.

## Related

- `biome.json`
- `package.json`
- `scripts/arch-check.mjs`
- `package.json`
