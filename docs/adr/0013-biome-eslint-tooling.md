# ADR-0013: Divide Formatting and Linting Between Biome and ESLint

## Status

Accepted

## Context

The repository needs fast, deterministic formatting and type-aware JavaScript and TypeScript linting. One tool does not provide the desired combination without adding avoidable runtime or configuration cost.

## Decision

Biome owns formatting and basic syntax/style formatting checks. ESLint owns semantic, import-direction, compatibility, and project-specific lint rules. Stylelint, HTMLHint, and markdownlint retain ownership of their respective file formats.

Declared tools are invoked from the lockfile-installed binaries; CI installs with `npm ci --ignore-scripts`.

## Consequences

- `npm run format:check` is the formatting contract.
- `npm run lint` is the JavaScript and TypeScript lint contract.
- Markdown is formatted and linted by markdownlint, not Biome.
- Rules are not duplicated across formatters and linters.

## Related

- `biome.json`
- `eslint.config.mjs`
- `package.json`
