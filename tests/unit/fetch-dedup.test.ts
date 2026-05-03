import { describe, it, expect, afterEach } from "vitest";
import { fetchOnce, inflightCount, clearInflight } from "../../src/core/fetch-dedup";

describe("fetch-dedup", () => {
  afterEach(() => {
    clearInflight();
  });

  it("deduplicates concurrent calls with same key", async () => {
    let callCount = 0;
    const factory = (): Promise<string> => {
      callCount++;
      return new Promise((resolve) => setTimeout(() => resolve("data"), 10));
    };

    const [a, b] = await Promise.all([fetchOnce("k1", factory), fetchOnce("k1", factory)]);

    expect(a).toBe("data");
    expect(b).toBe("data");
    expect(callCount).toBe(1);
  });

  it("allows subsequent calls after resolution", async () => {
    let callCount = 0;
    const factory = (): Promise<number> => Promise.resolve(++callCount);

    const first = await fetchOnce("k2", factory);
    const second = await fetchOnce("k2", factory);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(callCount).toBe(2);
  });

  it("evicts on rejection so next call retries", async () => {
    let attempt = 0;
    const factory = (): Promise<string> => {
      attempt++;
      if (attempt === 1) return Promise.reject(new Error("fail"));
      return Promise.resolve("ok");
    };

    await expect(fetchOnce("k3", factory)).rejects.toThrow("fail");
    expect(inflightCount()).toBe(0);

    const result = await fetchOnce("k3", factory);
    expect(result).toBe("ok");
  });

  it("tracks inflight count", async () => {
    const never = new Promise<string>(() => {});
    fetchOnce("a", () => never);
    fetchOnce("b", () => never);
    expect(inflightCount()).toBe(2);
  });
});
