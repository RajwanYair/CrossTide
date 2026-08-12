/** Browser-mode coverage for deterministic provider replay scenarios. */
import { describe, expect, it } from "vitest";
import { createProviderChain } from "../../src/providers/provider-chain";
import { createReplayProvider, PROVIDER_REPLAYS } from "../helpers/provider-replay";

describe("provider replay browser fixtures", () => {
  it.each(PROVIDER_REPLAYS)("replays $scenario without network access", async (replay) => {
    const chain = createProviderChain([
      createReplayProvider("primary", replay.primary),
      createReplayProvider("fallback", replay.fallback),
    ]);

    const quote = await chain.getQuote("AAPL");
    const diagnostics = chain.getDiagnostics!();
    const expectedFallback = replay.primary instanceof Error;

    expect(quote).toEqual(expectedFallback ? replay.fallback : replay.primary);
    expect(diagnostics.selectedProvider).toBe(expectedFallback ? "fallback" : "primary");
    expect(diagnostics.operation).toBe("quote");
    expect(diagnostics.degraded).toBe(expectedFallback);
  });
});
