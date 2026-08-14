/**
 * Verify that shared performance budgets have executable CI or probe ownership.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const { PERFORMANCE_BUDGETS } = await import(
  new URL("../src/core/perf-metrics.ts", import.meta.url).href
);
const lighthouseConfig = JSON.parse(await readFile(resolve("config/lighthouserc.json"), "utf8"));

const lighthouseMetricByBudgetMetric = {
  lcp: "largest-contentful-paint",
  inp: "interaction-to-next-paint",
  cls: "cumulative-layout-shift",
  longTaskMs: "total-blocking-time",
  routeTransitionMs: "interactive",
};
const probeOnlyMetrics = new Set([
  "workerP95Ms",
  "cacheHitRate",
  "websocketRecoveryMs",
  "memoryMb",
]);
const assertions = lighthouseConfig.ci?.assert?.assertions;
const errors = [];
const seenMetrics = new Set();

if (!assertions || typeof assertions !== "object") {
  errors.push("config/lighthouserc.json has no Lighthouse assertions");
}

for (const budget of PERFORMANCE_BUDGETS) {
  if (seenMetrics.has(budget.metric)) {
    errors.push(`duplicate performance budget: ${budget.metric}`);
  }
  seenMetrics.add(budget.metric);

  if (!Number.isFinite(budget.maximum) || budget.maximum < 0) {
    errors.push(`invalid maximum for ${budget.metric}: ${budget.maximum}`);
  }

  const assertionName = lighthouseMetricByBudgetMetric[budget.metric];
  if (assertionName) {
    const assertion = assertions?.[assertionName];
    const maximum = assertion?.[1]?.maxNumericValue;
    if (maximum !== budget.maximum) {
      errors.push(
        `${budget.metric} mismatch: shared=${budget.maximum}, lighthouse=${maximum ?? "missing"}`,
      );
    }
    continue;
  }

  if (!probeOnlyMetrics.has(budget.metric)) {
    errors.push(`unowned performance budget: ${budget.metric}`);
  }
}

const ownedMetrics = new Set([...Object.keys(lighthouseMetricByBudgetMetric), ...probeOnlyMetrics]);
for (const metric of ownedMetrics) {
  if (!seenMetrics.has(metric)) {
    errors.push(`performance owner has no shared budget: ${metric}`);
  }
}

if (errors.length > 0) {
  console.error("Performance budget check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Performance budgets verified: ${PERFORMANCE_BUDGETS.length} metrics`);
}
