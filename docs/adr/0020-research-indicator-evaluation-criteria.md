# ADR-0020: Research Indicator, ML, And Alternative Data Evaluation Criteria

- **Status:** Accepted
- **Date:** 2026-08-16
- **Owner:** Domain maintainers
- **Related roadmap:** R03, T06

## Context

CrossTide already ships 220+ pure domain modules. Proposals for advanced research
indicators, machine-learning signal producers, causal analysis, or alternative data
sources arrive faster than user evidence can justify them. Adding depth without a
qualifying bar repeats the failure mode this roadmap already rejects: capability that
is not reachable, not explainable, or not backed by a real workflow.

## Decision

No research indicator, ML signal, causal analysis feature, or alternative-data source
ships until its proposal document is accepted against **all** of the following:

1. **Validation data** — a labeled or reproducible dataset the calculation was checked
   against, referenced by path or source, not asserted from memory.
2. **Explainability** — the feature exposes its inputs, weights or coefficients, and
   confidence/limitation the same way `consensus`, `screener`, and `BacktestExplanation`
   already do (Phase 3, D08). A black-box score without an explanation surface is
   rejected regardless of accuracy claims.
3. **Maintenance cost** — an explicit owner accepts the ongoing cost of the data
   dependency, model retraining or drift, and browser/Worker compute budget before
   the feature is scheduled.
4. **User need** — a real workflow gap identified through the T06 feedback loop, not
   a hypothetical use case. Until T06 has recruited external users, this input remains
   unmet and blocks activation for anything beyond a documented internal proposal.

A proposal that cannot state evidence for all four criteria is recorded as a rejected
or deferred ADR addendum rather than scheduled as roadmap work.

## Consequences

- R03 stays "Planned" until a specific proposal is accepted against this checklist;
  this ADR itself is the evaluation framework the roadmap acceptance evidence pointed
  to, not a decision to build any specific indicator.
- Proposals blocked purely on criterion 4 (user need) are re-evaluated when T06
  produces its first consented usability finding.
- This ADR does not authorize WebLLM/local-model producers — that boundary is owned
  by [ADR-0018](0018-ai-feature-boundary.md).

## Related

- `docs/ROADMAP.md` Phase 3 (D08), Phase 9 (R03)
- [ADR-0018: AI feature boundary](0018-ai-feature-boundary.md)
- `docs/CAPABILITY_MATRIX.md`
