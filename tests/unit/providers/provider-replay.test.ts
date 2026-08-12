/** Deterministic replay coverage for provider success and degradation states. */
import { describe, expect, it } from "vitest";
import { createProviderChain } from "../../../src/providers/provider-chain";
import { createReplayProvider, PROVIDER_REPLAYS } from "../../helpers/provider-replay";

describe("provider replay scenarios", () => {
  it.each(PROVIDER_REPLAYS)("replays $scenario deterministically", async (replay) => {
    const chain = createProviderChain([
      createReplayProvider("primary", replay.primary),
      createReplayProvider("fallback", replay.fallback),
    ]);

    const quote = await chain.getQuote("AAPL");
    const diagnostics = chain.getDiagnostics!();

    expect(quote).toEqual(replay.primary instanceof Error ? replay.fallback : replay.primary);
    expect(diagnostics.selectedProvider).toBe(
      replay.primary instanceof Error ? "fallback" : "primary",
    );
    expect(diagnostics.operation).toBe("quote");
  });
});
