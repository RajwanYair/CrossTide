/** Self-hosting contract tests for the Docker image and Compose service. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dockerfile = readFileSync(resolve(process.cwd(), "Dockerfile"), "utf8");
const compose = readFileSync(resolve(process.cwd(), "docker-compose.yml"), "utf8");
const operations = readFileSync(resolve(process.cwd(), "docs/OPERATIONS.md"), "utf8");

describe("Docker self-hosting contract", () => {
  it("installs and uses the image healthcheck dependency", () => {
    expect(dockerfile).toContain("apt-get install -y --no-install-recommends curl");
    expect(dockerfile).toContain("HEALTHCHECK");
    expect(dockerfile).toContain("curl -f http://localhost:8787/api/health");
  });

  it("keeps the service port, persistence volume, and restart policy aligned", () => {
    expect(compose).toContain('"${PORT:-8787}:8787"');
    expect(compose).toContain("crosstide-data:/app/.wrangler");
    expect(compose).toContain("restart: unless-stopped");
    expect(compose).toContain("curl");
    expect(compose).toContain("/api/health");
  });

  it("allows a clean checkout to configure Compose without a secret file", () => {
    expect(compose).toContain("path: .env");
    expect(compose).toContain("required: false");
  });

  it("documents the self-hosted build, recovery, persistence, and shutdown rehearsal", () => {
    expect(operations).toContain("### Rehearse Self-Hosted Recovery");
    expect(operations).toContain("docker compose config");
    expect(operations).toContain("docker compose build");
    expect(operations).toContain("docker compose up -d");
    expect(operations).toContain("/api/health");
    expect(operations).toContain("/api/migrations/status");
    expect(operations).toContain("docker compose restart");
    expect(operations).toContain("docker compose down");
    expect(operations).toContain("docker volume ls --filter name=crosstide-data");
  });
});
