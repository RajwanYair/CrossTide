import { createWebTsAppEslintConfig } from "../tooling/eslint/web-ts-app.mjs";

const config = createWebTsAppEslintConfig({
  ignores: ["node_modules/**", "dist/**", "coverage/**", "build/**"],
  sourceFiles: ["src/**/*.ts"],
  sourceProject: "./tsconfig.json",
  tsconfigRootDir: import.meta.dirname,
  testFiles: ["tests/**/*.ts"],
  swFiles: [],
  sourceRules: {
    "@typescript-eslint/explicit-function-return-type": "error",
    "no-console": ["error", { allow: ["warn", "error"] }],
  },
});

// Permit Node-only scripts (no TS project) to use console freely.
config.push({
  files: ["scripts/**/*.mjs"],
  languageOptions: {
    globals: {
      console: "readonly",
      process: "readonly",
    },
  },
  rules: {
    "no-console": "off",
  },
});

export default config;
