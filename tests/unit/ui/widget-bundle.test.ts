/**
 * Guards the embeddable widget build contract (E21).
 *
 * The widget already existed as source, but until E21 nothing built it and no
 * check would fail if someone removed the stable `widget.mjs` output from the
 * pipeline. This test keeps the bundle contract visible in CI without having to
 * execute a second build during the test phase.
 *
 * @vitest-environment node
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import widgetViteConfig from "../../../vite.widget.config.ts";

interface RootPackageJson {
  readonly scripts?: Readonly<Record<string, string>>;
}

function readRootPackageJson(): RootPackageJson {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "package.json"), "utf-8"),
  ) as RootPackageJson;
}

describe("widget build contract", () => {
  it("emits a stable widget.mjs artifact from src/ui/widget.ts", () => {
    const build = widgetViteConfig.build;
    const lib = build?.lib;

    expect(typeof lib).toBe("object");
    expect(typeof lib?.entry).toBe("string");
    expect(String(lib?.entry).replaceAll("\\", "/")).toMatch(/src\/ui\/widget\.ts$/u);
    expect(lib?.formats).toEqual(["es"]);
    expect(lib?.fileName?.("widget")).toBe("widget.mjs");
    expect(build?.outDir).toBe("dist");
    expect(build?.emptyOutDir).toBe(false);
  });

  it("is wired into the standard build scripts", () => {
    const scripts = readRootPackageJson().scripts ?? {};

    expect(scripts["build:widget"]).toBe("vite build --config vite.widget.config.ts");
    expect(scripts["build"]).toContain("npm run build:widget");
    expect(scripts["build:only"]).toContain("npm run build:widget");
  });
});
