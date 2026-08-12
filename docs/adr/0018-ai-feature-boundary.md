# ADR-0018: AI Feature Boundary

- **Status:** Accepted
- **Date:** 2026-08-12
- **Owner:** Product maintainers
- **Related roadmap:** A02, U01

## Context

`src/core/ai-disclaimer.ts` defines consent and disclosure helpers for possible
AI features, but the current application has no AI producer. Consensus, portfolio,
backtest, screener, and signal DSL outputs are deterministic or user-authored;
labeling them as AI-generated would be inaccurate.

## Decision

Defer the AI disclaimer framework until a supported AI producer is accepted as a
product feature. The module remains retained and tested, but must not be wired to
deterministic result surfaces solely to remove a reachability warning. The first
AI producer must use the framework's consent guard and visible disclosure helpers
as part of the same implementation.

## Acceptance criteria for activation

- A product ADR identifies the AI producer, model boundary, and data handling.
- A real result surface invokes `requireConsent` before producing output.
- AI output is wrapped with `wrapWithDisclaimer` and has focused UI tests.
- The capability matrix classifies the feature independently from deterministic
  analysis capabilities.
