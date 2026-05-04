/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Enforce types used in this project
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    // Subject must be lowercase (conventional commits standard)
    "subject-case": [2, "always", ["lower-case", "sentence-case"]],
    // Enforce max header length
    "header-max-length": [2, "always", 120],
  },
};
