import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("index.html local shell", () => {
  it("contains the app entry script and core shell nodes", () => {
    const htmlPath = resolve(process.cwd(), "index.html");
    const html = readFileSync(htmlPath, "utf8");

    expect(html).toContain("<title>CrossTide</title>");
    expect(html).toContain('id="app-header"');
    expect(html).toContain('id="app-nav"');
    expect(html).toContain('id="app-main"');
    expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]+"\s*\/>/s);

    // Local Vite execution depends on the module entry script.
    expect(html).toMatch(/<script\s+type="module"\s+src="\/src\/main\.ts"><\/script>/);
  });
});
