import { describe, it, expect } from "vitest";
import { handleHealth } from "../../../worker/routes/health";

type Env = Parameters<typeof handleHealth>[0];

function makeEnv(overrides: Partial<Record<string, string>> = {}): Env {
  return {
    API_VERSION: overrides.API_VERSION ?? "2",
    ENVIRONMENT: overrides.ENVIRONMENT ?? "test",
  } as Env;
}

describe("handleHealth", () => {
  it("returns 200 with ok status", () => {
    const res = handleHealth(makeEnv());
    expect(res.status).toBe(200);
  });

  it("returns correct JSON body structure", async () => {
    const res = handleHealth(makeEnv());
    const body = (await res.json()) as {
      status: string;
      version: string;
      timestamp: string;
      environment: string;
    };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("2");
    expect(body.environment).toBe("test");
    expect(body.timestamp).toBeTruthy();
  });

  it("uses default version when not provided", async () => {
    const env = { ENVIRONMENT: "staging" } as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as { version: string };
    expect(body.version).toBe("1");
  });

  it("uses default environment when not provided", async () => {
    const env = { API_VERSION: "3" } as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as { environment: string };
    expect(body.environment).toBe("production");
  });

  it("returns valid ISO timestamp", async () => {
    const res = handleHealth(makeEnv());
    const body = (await res.json()) as { timestamp: string };
    const parsed = new Date(body.timestamp);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it("sets content-type header", () => {
    const res = handleHealth(makeEnv());
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });
});
