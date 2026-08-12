/**
 * Guards the `@crosstide/domain` package manifest against the repository it is
 * carved out of.
 *
 * The package is a re-publication of `src/domain`, so nothing in it is written
 * by hand except `package.json`. That makes the manifest the only place the two
 * can drift: a stale version, a dependency creeping in, or an `exports` entry
 * pointing at a path the build does not produce. Each of those ships a broken
 * tarball that no other gate would notice, because the app never imports the
 * package.
 *
 * @module tests/unit/domain/package-manifest
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

interface Manifest {
  readonly name: string;
  readonly version: string;
  readonly type?: string;
  readonly sideEffects?: boolean;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly exports?: Readonly<Record<string, unknown>>;
  readonly files?: readonly string[];
  readonly publishConfig?: { readonly access?: string };
}

function readJson(relativePath: string): Manifest {
  return JSON.parse(readFileSync(resolve(process.cwd(), relativePath), "utf-8")) as Manifest;
}

const pkg = readJson("packages/domain/package.json");
const root = readJson("package.json");

describe("@crosstide/domain package manifest", () => {
  it("tracks the application version exactly", () => {
    // The README promises that @crosstide/domain@x.y.z is the engine that
    // shipped in CrossTide x.y.z. A release that bumps one and not the other
    // makes that claim false.
    expect(pkg.version).toBe(root.version);
  });

  it("declares no runtime dependencies", () => {
    // The domain layer imports nothing but its own modules and src/types, which
    // is what lets the package advertise itself as zero-dependency. arch-check
    // enforces the layer direction; this enforces the consequence.
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(pkg.peerDependencies ?? {}).toEqual({});
  });

  it("ships as side-effect-free ESM so consumers can tree-shake it", () => {
    expect(pkg.type).toBe("module");
    expect(pkg.sideEffects).toBe(false);
  });

  it("is publishable as a public scoped package", () => {
    expect(pkg.name).toBe("@crosstide/domain");
    expect(pkg.publishConfig?.access).toBe("public");
    expect(pkg.files).toContain("dist");
  });

  it("points every export at a path the build produces under dist/", () => {
    const entry = pkg.exports?.["."] as { types?: string; import?: string } | undefined;
    expect(entry?.import).toMatch(/^\.\/dist\//u);
    expect(entry?.types).toMatch(/^\.\/dist\//u);
  });

  it("keeps browser-only helpers behind an explicit subpath", () => {
    const browser = pkg.exports?.["./browser"] as { types?: string; import?: string } | undefined;
    expect(browser?.import).toBe("./dist/browser.js");
    expect(browser?.types).toBe("./dist/types/domain/browser-index.d.ts");
  });
});

describe("domain layer purity", () => {
  /** Every `.ts` file under `src/domain`, recursively. */
  function collect(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return collect(full);
      return entry.name.endsWith(".ts") ? [full] : [];
    });
  }

  it("imports nothing from outside the domain and types layers", () => {
    // This is what makes the package extractable at all: the Vite lib build
    // follows every import, so a single module reaching into core or cards
    // drags that layer — and its dependencies — into the published tarball.
    // `fetchFundamentals` did exactly that, calling core's fetch wrapper from
    // inside a layer documented as pure, and arch-check allowed it because
    // `domain->core` sat on its allowlist.
    const domainDir = resolve(process.cwd(), "src/domain");
    const escapes: string[] = [];

    for (const file of collect(domainDir)) {
      const source = readFileSync(file, "utf-8");
      for (const match of source.matchAll(/from "(\.[^"]+)"/gu)) {
        const specifier = match[1] ?? "";
        const target = resolve(join(file, ".."), specifier).replaceAll("\\", "/");
        const insideDomain = target.includes("/src/domain/");
        const insideTypes = target.includes("/src/types/");
        if (!insideDomain && !insideTypes) {
          escapes.push(`${relative(process.cwd(), file).replaceAll("\\", "/")} → ${specifier}`);
        }
      }
    }

    expect(escapes).toEqual([]);
  });
});
