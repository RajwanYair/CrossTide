/** Tests the Worker-first URL selection and browser-origin resolution policy. */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORKER_BASE_URL,
  DEV_WORKER_BASE_URL,
  getConfiguredWorkerBaseUrl,
  resolveWorkerBaseUrl,
} from "../../../src/core/worker-config.js";

describe("worker-config", () => {
  it.each([
    [undefined, true, DEFAULT_WORKER_BASE_URL],
    ["", true, DEFAULT_WORKER_BASE_URL],
    ["  ", false, DEV_WORKER_BASE_URL],
    ["https://worker.example.test", true, "https://worker.example.test"],
    ["  /custom-worker  ", false, "/custom-worker"],
  ] as const)("selects %s for CI=%s as %s", (configuredUrl, isCi, expected) => {
    expect(getConfiguredWorkerBaseUrl(configuredUrl, isCi)).toBe(expected);
  });

  it("resolves a development proxy against the browser origin", () => {
    expect(resolveWorkerBaseUrl(DEV_WORKER_BASE_URL, "https://app.example.test")).toBe(
      "https://app.example.test/api/worker",
    );
  });

  it("keeps an absolute Worker URL unchanged", () => {
    expect(resolveWorkerBaseUrl(DEFAULT_WORKER_BASE_URL, "https://app.example.test")).toBe(
      DEFAULT_WORKER_BASE_URL,
    );
  });
});
