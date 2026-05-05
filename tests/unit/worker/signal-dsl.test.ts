import { describe, it, expect } from "vitest";
import { handleSignalDslExecute } from "../../../worker/routes/signal-dsl";

function makeRequest(body: unknown): Request {
  return new Request("https://worker.example.com/api/signal-dsl/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handleSignalDslExecute", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("https://worker.example.com/api/signal-dsl/execute", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleSignalDslExecute(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/json/i);
  });

  it("returns 400 when expression field is missing", async () => {
    const res = await handleSignalDslExecute(makeRequest({ vars: { rsi: 50 } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/expression/i);
  });

  it("returns 400 when expression is empty string", async () => {
    const res = await handleSignalDslExecute(makeRequest({ expression: "   " }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/expression/i);
  });

  it("returns 400 when vars contains non-numeric value", async () => {
    const res = await handleSignalDslExecute(
      makeRequest({ expression: "x > 0", vars: { x: "bad" } }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for syntactically invalid expression", async () => {
    const res = await handleSignalDslExecute(makeRequest({ expression: "(((" }));
    expect(res.status).toBe(400);
  });

  it("evaluates a simple arithmetic expression", async () => {
    const res = await handleSignalDslExecute(makeRequest({ expression: "2 + 3" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { result: number }).result).toBe(5);
  });

  it("evaluates a comparison expression with variables", async () => {
    const res = await handleSignalDslExecute(
      makeRequest({ expression: "rsi > 50", vars: { rsi: 60 } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { result: boolean }).result).toBe(true);
  });

  it("evaluates a false comparison", async () => {
    const res = await handleSignalDslExecute(
      makeRequest({ expression: "rsi > 70", vars: { rsi: 55 } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { result: boolean }).result).toBe(false);
  });

  it("evaluates a logical AND expression", async () => {
    const res = await handleSignalDslExecute(
      makeRequest({ expression: "rsi > 30 and adx > 25", vars: { rsi: 45, adx: 30 } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { result: boolean }).result).toBe(true);
  });

  it("evaluates abs builtin function", async () => {
    const res = await handleSignalDslExecute(makeRequest({ expression: "abs(-5)" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { result: number }).result).toBe(5);
  });

  it("evaluates without vars when vars is omitted", async () => {
    const res = await handleSignalDslExecute(makeRequest({ expression: "1 + 1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { result: number }).result).toBe(2);
  });

  it("returns 400 when referencing undefined variable", async () => {
    // Undefined variable should throw during evaluation
    const res = await handleSignalDslExecute(makeRequest({ expression: "undefined_var > 0" }));
    expect(res.status).toBe(400);
  });
});
