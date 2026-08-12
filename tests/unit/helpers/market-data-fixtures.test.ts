/** Tests for deterministic provider replay fixtures. */
import { describe, expect, it } from "vitest";
import {
  PROVIDER_REPLAY_FIXTURES,
  replayProviderFixture,
} from "../../helpers/market-data-fixtures.js";

describe("replayProviderFixture", () => {
  it.each(PROVIDER_REPLAY_FIXTURES)("replays $name without network access", (fixture) => {
    const first = replayProviderFixture(fixture);
    const second = replayProviderFixture(fixture);

    expect(second).toEqual(first);
    expect(second).not.toBe(fixture.outcome);
  });

  it("does not share nested payload references between replays", () => {
    const fixture = PROVIDER_REPLAY_FIXTURES.find(
      (candidate) => candidate.outcome.kind === "disagreement",
    );
    expect(fixture).toBeDefined();

    const first = replayProviderFixture(fixture!);
    const second = replayProviderFixture(fixture!);
    expect(first).not.toBe(second);
    if (first.kind === "disagreement" && second.kind === "disagreement") {
      expect(first.payloads).not.toBe(second.payloads);
    }
  });
});
